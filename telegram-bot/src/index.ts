import { Telegraf, Context, Markup } from 'telegraf';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const BOT_TOKEN = process.env.BOT_TOKEN || '8620627512:AAEJ8w7LzZEj5E6ofE9F6FzPhYbJTkP8QBk';
const WORKER_URL = process.env.WORKER_URL || 'https://anime.apex-cloud.workers.dev';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0';

if (!BOT_TOKEN) {
    console.error('Please set BOT_TOKEN environment variable');
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Session storage for pagination
interface UserSession {
    animeId: string;
    animeTitle: string;
    currentPage: number;
    totalPages: number;
    totalEpisodes: number;
}

const userSessions = new Map<number, UserSession>();
const episodeCache = new Map<string, { animeId: string; sessionId: string }>();
let episodeCounter = 0;

// Generate short unique ID for episode
function generateEpisodeId(animeId: string, sessionId: string): string {
    const shortId = `ep_${++episodeCounter}`;
    episodeCache.set(shortId, { animeId, sessionId });
    
    // Clean old entries if cache gets too large
    if (episodeCache.size > 1000) {
        const firstKey = episodeCache.keys().next().value;
        if (firstKey) episodeCache.delete(firstKey);
    }
    
    return shortId;
}

// Helper function to get download link for an episode
async function getEpisodeLinks(animeId: string, sessionId: string): Promise<Array<{ name: string; link: string }>> {
    try {
        const response = await axios.get(WORKER_URL, {
            params: {
                method: 'episode',
                session: animeId,
                ep: sessionId
            },
            headers: { 'User-Agent': USER_AGENT }
        });
        return response.data || [];
    } catch (error) {
        console.error('Error fetching episode links:', error);
        return [];
    }
}

// Search command
bot.command('search', async (ctx: Context) => {
    const query = ctx.message && 'text' in ctx.message ? 
        (ctx.message.text as string).replace('/search ', '').trim() : '';
    
    if (!query) {
        await ctx.reply('Please provide a search query. Example: /search Naruto');
        return;
    }

    await ctx.reply('Searching...');

    try {
        const response = await axios.get(WORKER_URL, {
            params: {
                method: 'search',
                query: query
            },
            headers: { 'User-Agent': USER_AGENT }
        });

        const results = response.data;
        
        if (!results || !results.data || results.data.length === 0) {
            await ctx.reply('No results found.');
            return;
        }

        const buttons = results.data.slice(0, 10).map((item: any) => {
            return [Markup.button.callback(
                `${item.title} (${item.episodes || 'N/A'})`,
                `anime_${item.session}`
            )];
        });

        await ctx.reply(
            `Found ${results.data.length} results for "${query}":\n\nSelect an anime:`,
            Markup.inlineKeyboard(buttons)
        );

    } catch (error) {
        console.error('Search error:', error);
        await ctx.reply('Error searching. Please try again.');
    }
});

// Callback handler for anime selection
bot.action(/anime_(.+)/, async (ctx: any) => {
    const match = ctx.match as RegExpMatchArray;
    const animeId = match && match[1];
    
    if (!animeId) {
        await ctx.answerCbQuery('Invalid anime ID');
        return;
    }

    await ctx.answerCbQuery();
    await ctx.reply('Loading episodes...');

    try {
        const response = await axios.get(WORKER_URL, {
            params: {
                method: 'series',
                session: animeId,
                page: 1
            },
            headers: { 'User-Agent': USER_AGENT }
        });

        const data = response.data;
        
        // Store session for pagination
        userSessions.set(ctx.from?.id || 0, {
            animeId: animeId,
            animeTitle: data.title,
            currentPage: 1,
            totalPages: data.total_pages,
            totalEpisodes: data.total
        });

        const episodes = data.episodes || [];
        
        // Create episode buttons (max 15 per page)
        const episodeButtons = episodes.slice(0, 15).map((ep: any) => {
            const shortId = generateEpisodeId(animeId, ep.session);
            return [Markup.button.callback(
                `Episode ${ep.episode}`,
                shortId
            )];
        });

        // Add pagination and download all buttons
        const navigationButtons: any[] = [];
        
        if (data.next) {
            navigationButtons.push([Markup.button.callback('Next ➡️', `next_${animeId}_2`)]);
        }

        if (episodes.length > 0) {
            navigationButtons.push([Markup.button.callback('📥 Download All', `download_all_${animeId}_1`)]);
        }

        await ctx.reply(
            `📺 ${data.title}\nTotal Episodes: ${data.total}\nPage: ${data.page}/${data.total_pages}\n\nSelect an episode:`,
            Markup.inlineKeyboard([...episodeButtons, ...navigationButtons])
        );

    } catch (error) {
        console.error('Error loading episodes:', error);
        await ctx.reply('Error loading episodes. Please try again.');
    }
});

// Callback handler for next page
bot.action(/next_(.+)_(\d+)/, async (ctx: any) => {
    const match = ctx.match as RegExpMatchArray;
    const animeId = match && match[1];
    const page = parseInt(match[2]);
    
    if (!animeId) {
        await ctx.answerCbQuery('Invalid anime ID');
        return;
    }

    await ctx.answerCbQuery();
    await ctx.editMessageText('Loading episodes...');

    try {
        const response = await axios.get(WORKER_URL, {
            params: {
                method: 'series',
                session: animeId,
                page: page.toString()
            },
            headers: { 'User-Agent': USER_AGENT }
        });

        const data = response.data;
        
        // Update session
        userSessions.set(ctx.from?.id || 0, {
            animeId: animeId,
            animeTitle: data.title,
            currentPage: page,
            totalPages: data.total_pages,
            totalEpisodes: data.total
        });

        const episodes = data.episodes || [];
        
        const episodeButtons = episodes.slice(0, 15).map((ep: any) => {
            const shortId = generateEpisodeId(animeId, ep.session);
            return [Markup.button.callback(
                `Episode ${ep.episode}`,
                shortId
            )];
        });

        const navigationButtons: any[] = [];
        
        if (page > 1) {
            navigationButtons.push([Markup.button.callback('⬅️ Previous', `next_${animeId}_${page - 1}`)]);
        }
        
        if (data.next) {
            navigationButtons.push([Markup.button.callback('Next ➡️', `next_${animeId}_${page + 1}`)]);
        }

        navigationButtons.push([Markup.button.callback('📥 Download All', `download_all_${animeId}_${page}`)]);

        await ctx.editMessageText(
            `📺 ${data.title}\nTotal Episodes: ${data.total}\nPage: ${data.page}/${data.total_pages}\n\nSelect an episode:`,
            Markup.inlineKeyboard([...episodeButtons, ...navigationButtons])
        );

    } catch (error) {
        console.error('Error loading episodes:', error);
        await ctx.reply('Error loading episodes. Please try again.');
    }
});

// Callback handler for individual episode
bot.action(/ep_(.+)_(.+)/, async (ctx: any) => {
    const match = ctx.match as RegExpMatchArray;
    const animeId = match && match[1];
    const sessionId = match && match[2];
    
    if (!animeId || !sessionId) {
        await ctx.answerCbQuery('Invalid episode ID');
        return;
    }

    await ctx.answerCbQuery('Fetching download links...');

    try {
        const links = await getEpisodeLinks(animeId, sessionId);
        
        if (links.length === 0) {
            await ctx.reply('No download links available for this episode.');
            return;
        }

        const qualityButtons = links.map((link: any) => {
            return [Markup.button.url(`📥 ${link.name}`, link.link)];
        });

        await ctx.reply(
            `Episode ${sessionId.replace(/^[^0-9]*/, '')}\nAvailable qualities:`,
            Markup.inlineKeyboard(qualityButtons)
        );

    } catch (error) {
        console.error('Error fetching episode links:', error);
        await ctx.reply('Error fetching download links. Please try again.');
    }
});

// Callback handler for download all
bot.action(/download_all_(.+)_(\d+)/, async (ctx: any) => {
    const match = ctx.match as RegExpMatchArray;
    const animeId = match && match[1];
    const startPage = parseInt(match[2]);
    
    if (!animeId) {
        await ctx.answerCbQuery('Invalid anime ID');
        return;
    }

    await ctx.answerCbQuery('Starting bulk download...');
    await ctx.reply('🔄 Fetching all episodes. This may take a while...');

    try {
        // First, get total pages
        const firstPageResponse = await axios.get(WORKER_URL, {
            params: {
                method: 'series',
                session: animeId,
                page: 1
            },
            headers: { 'User-Agent': USER_AGENT }
        });

        const totalPages = firstPageResponse.data.total_pages;
        const animeTitle = firstPageResponse.data.title;

        let allEpisodes: any[] = [];

        // Fetch all pages
        for (let page = 1; page <= totalPages; page++) {
            await ctx.reply(`📄 Fetching page ${page}/${totalPages}...`);
            
            const response = await axios.get(WORKER_URL, {
                params: {
                    method: 'series',
                    session: animeId,
                    page: page.toString()
                },
                headers: { 'User-Agent': USER_AGENT }
            });

            allEpisodes = [...allEpisodes, ...(response.data.episodes || [])];
        }

        await ctx.reply(`📦 Found ${allEpisodes.length} episodes. Sending download links...`);

        // Send episodes in batches with their download links
        for (let i = 0; i < allEpisodes.length; i += 10) {
            const batch = allEpisodes.slice(i, i + 10);
            
            for (const episode of batch) {
                try {
                    const links = await getEpisodeLinks(animeId, episode.session);
                    
                    if (links.length > 0) {
                        const qualityButtons = links.map((link: any) => {
                            return [Markup.button.url(`📥 ${link.name}`, link.link)];
                        });

                        await ctx.reply(
                            `🎬 ${animeTitle} - Episode ${episode.episode}`,
                            Markup.inlineKeyboard(qualityButtons)
                        );
                        
                        // Small delay to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                } catch (error) {
                    console.error(`Error fetching links for episode ${episode.episode}:`, error);
                }
            }
        }

        await ctx.reply('✅ All episodes sent!');

    } catch (error) {
        console.error('Error in bulk download:', error);
        await ctx.reply('Error during bulk download. Please try again.');
    }
});

// Start command
bot.start(async (ctx: Context) => {
    await ctx.reply(
        `👋 Welcome to Anime Download Bot!\n\n` +
        `🔍 Use /search <query> to search for anime\n` +
        `Example: /search Naruto\n\n` +
        `You can also browse through episodes and download them individually or all at once!`
    );
});

// Help command
bot.help(async (ctx: Context) => {
    await ctx.reply(
        `📖 Bot Commands:\n\n` +
        `/start - Start the bot\n` +
        `/search <query> - Search for anime\n` +
        `/help - Show this help message\n\n` +
        `After searching, click on an anime to see episodes.\n` +
        `Click on an episode to get download links.\n` +
        `Use "Download All" to get all episodes at once.`
    );
});

// Error handler
bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    ctx.reply('An error occurred. Please try again.');
});

// Start the bot
console.log('🤖 Telegram bot starting...');
bot.launch().then(() => {
    console.log('✅ Bot is running!');
}).catch(err => {
    console.error('Failed to start bot:', err);
    process.exit(1);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
