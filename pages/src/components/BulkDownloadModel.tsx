import {
  Button,
  Checkbox,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { Zip, ZipPassThrough } from "fflate";
import { DownloadLinks, EpisodeResult } from "fetch/requests";
import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AUTH_TOKEN, KWIK } from "../config/config";
import { toBase64Url } from '../utils/b64';

interface BulkDownloadModelProps {
  isOpen: boolean;
  setIsPreparing: Dispatch<SetStateAction<boolean>>;
  onOpenChange: () => void;
  animeServer: string;
  seriesId: string;
  seriesName: string;
  totalPages: number;
  currentEpisodes: EpisodeResult["episodes"];
}

type ParsedOption = {
  baseLabel: string;
  audio: string | null;
  key: string;
  displayLabel: string;
};

const sanitizeFilename = (name: string) => {
  return name
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();
};

const parseAudioTag = (raw: string) => {
  const t = raw.toLowerCase();
  if (/\bdual\b|\bdual[-\s]?audio\b/.test(t)) return "DUAL";
  if (/\beng\b|\benglish\b/.test(t)) return "ENG";
  if (/\bjpn\b|\bjapanese\b/.test(t)) return "JPN";
  if (/\bdub\b|\bdubbed\b/.test(t)) return "DUB";
  return null;
};

const normalizeBaseLabel = (label: string) => {
  return label
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const parseLinkName = (name: string): ParsedOption => {
  const audio = parseAudioTag(name);
  const baseLabel = normalizeBaseLabel(name);
  const key = `${baseLabel}||${audio ?? ""}`;
  const displayLabel = audio ? `${baseLabel} (${audio})` : baseLabel;
  return { baseLabel, audio, key, displayLabel };
};

const intersect = (a: Set<string>, b: Set<string>) => {
  const out = new Set<string>();
  for (const item of a) if (b.has(item)) out.add(item);
  return out;
};

const runPool = async <T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  /* Define a single runner function */
  const runNext = async (): Promise<void> => {
    if (nextIndex >= items.length) return;

    const index = nextIndex++;
    results[index] = await worker(items[index], index);

    /* Tail-call style recursion to pick up the next available task */
    return runNext();
  };

  /* Launch the initial set of runners based on concurrency */
  const runners = Array.from(
    { length: Math.min(concurrency, items.length) },
    runNext
  );

  await Promise.all(runners);
  return results;
};

const fetchJson = async <T,>(url: string, signal: AbortSignal): Promise<T> => {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
};

const probeUrl = async (url: string, signal: AbortSignal): Promise<void> => {
  const res = await fetch(url, {
    method: "GET",
    headers: { Range: "bytes=0-0" },
    signal,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  /* Early return if no body (e.g., 204 No Content) */
  if (!res.body) return;

  /**
   * We use the built-in cancel() method on the stream directly.
   * This signals the browser to close the connection immediately 
   * after the first chunk is received, preventing unnecessary data transfer.
   */
  try {
    const reader = res.body.getReader();
    await reader.read();
    await reader.cancel();
  } catch (err) {
    /* Ignore errors during cancellation if the stream is already closed */
    if (!(err instanceof DOMException && err.name === 'AbortError')) {
      toast.error("Error during probe cancellation");
    }
  }
};

type DirectLinkResponse = {
  status: boolean;
  content?: { url?: string };
};

const BulkDownloadModel = ({
  isOpen,
  onOpenChange,
  animeServer,
  seriesId,
  seriesName,
  totalPages,
  currentEpisodes,
  setIsPreparing
}: BulkDownloadModelProps) => {
  const abortRef = useRef<AbortController | null>(null);

  const [onlyCurrentPage, setOnlyCurrentPage] = useState(false);
  const [isPreparing, setPreparing] = useState(false);
  const [isZipping, setZipping] = useState(false);
  const [progress, setProgress] = useState({ label: "", value: 0, max: 1 });

  const [episodes, setEpisodes] = useState<EpisodeResult["episodes"]>([]);
  const [linksByEpisode, setLinksByEpisode] = useState<Record<string, DownloadLinks>>({});
  const [selectedOptionKey, setSelectedOptionKey] = useState<string>("");

  const commonOptions = useMemo(() => {
    const episodeSessions = Object.keys(linksByEpisode);
    if (episodeSessions.length === 0) return [];

    let common: Set<string> | null = null;
    const displayByKey: Record<string, string> = {};

    for (const session of episodeSessions) {
      const keys = new Set(
        (linksByEpisode[session] ?? []).map(({ name }) => {
          const parsed = parseLinkName(name);
          displayByKey[parsed.key] = parsed.displayLabel;
          return parsed.key;
        })
      );
      common = common ? intersect(common, keys) : keys;
      if (common.size === 0) break;
    }

    return Array.from(common ?? [])
      .map((key) => ({ key, label: displayByKey[key] ?? key }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [linksByEpisode]);

  const selectedLinks = useMemo(() => {
    if (!selectedOptionKey) return [];
    const out: Array<{ episode: string; kwikUrl: string; displayLabel: string }> = [];

    for (const ep of episodes) {
      const links = linksByEpisode[ep.session] ?? [];
      const match = links.find(({ name }) => parseLinkName(name).key === selectedOptionKey);
      if (!match) return [];
      const parsed = parseLinkName(match.name);
      out.push({ episode: ep.episode, kwikUrl: match.link, displayLabel: parsed.displayLabel });
    }
    return out;
  }, [episodes, linksByEpisode, selectedOptionKey]);

  const prepare = async () => {
    if (!seriesId) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPreparing(true);
    setLinksByEpisode({});
    setEpisodes([]);
    setSelectedOptionKey("");
    setProgress({ label: "Fetching episode list...", value: 0, max: 1 });

    try {
      const eps: EpisodeResult["episodes"] = [];
      if (onlyCurrentPage) {
        eps.push(...currentEpisodes);
      } else {
        const pages = Math.max(1, totalPages || 1);
        setProgress({ label: "Fetching episode list...", value: 0, max: pages });
        for (let page = 1; page <= pages; page++) {
          const url = `${animeServer}/?method=series&session=${encodeURIComponent(seriesId)}&page=${page}`;
          const data = await fetchJson<EpisodeResult>(url, controller.signal);
          eps.push(...data.episodes);
          setProgress({ label: "Fetching episode list...", value: page, max: pages });
        }
      }

      setEpisodes(eps);
      if (eps.length === 0) {
        toast.error("No episodes found");
        return;
      }

      setProgress({ label: "Fetching download options...", value: 0, max: eps.length });
      let completed = 0;

      const results = await runPool(eps, 3, async (ep) => {
        const url = `${animeServer}/?method=episode&session=${encodeURIComponent(seriesId)}&ep=${encodeURIComponent(ep.session)}`;
        const links = await fetchJson<DownloadLinks>(url, controller.signal);
        completed += 1;
        setProgress({ label: "Fetching download options...", value: completed, max: eps.length });
        return { session: ep.session, links };
      });

      const mapping: Record<string, DownloadLinks> = {};
      for (const r of results) mapping[r.session] = r.links;
      setLinksByEpisode(mapping);
    } catch (err) {
      toast.error("Failed to prepare season download");
    } finally {
      setPreparing(false);
      setIsPreparing(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      abortRef.current?.abort();
      abortRef.current = null;
      setZipping(false);
      return;
    }
    prepare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, onlyCurrentPage, seriesId]);

  useEffect(() => {
    if (commonOptions.length > 0 && !selectedOptionKey) {
      setSelectedOptionKey(commonOptions[0].key);
    }
  }, [commonOptions, selectedOptionKey]);

  const fetchDirect = async (kwikUrl: string, signal: AbortSignal) => {
    const res = await fetch(`${KWIK}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service: "kwik",
        action: "fetch",
        content: { kwik: kwikUrl },
        auth: AUTH_TOKEN,
      }),
      signal,
    });
    if (!res.ok) throw new Error(`KWIK HTTP ${res.status}`);
    return (await res.json()) as DirectLinkResponse;
  };

  const downloadZipZap = async () => {
    if (selectedLinks.length === 0) return;

    const showSaveFilePicker = (window as { showSaveFilePicker?: unknown }).showSaveFilePicker as undefined | ((options?: object) => Promise<FileSystemFileHandle>);
    if (!showSaveFilePicker) {
      toast.error("Season ZIP requires Chrome/Edge (File System Access API)");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const safeSeries = sanitizeFilename(seriesName || seriesId);
    const safeLabel = sanitizeFilename(selectedLinks[0]?.displayLabel ?? "links");
    const zipName = `${safeSeries} - ${safeLabel}.zip`;

    setZipping(true);
    try {
      setProgress({ label: "Resolving direct links (Zap)...", value: 0, max: selectedLinks.length });

      let resolvedCount = 0;
      const resolved = await runPool(selectedLinks, 3, async (item) => {
        const direct = await fetchDirect(item.kwikUrl, controller.signal);
        if (!direct?.status || !direct.content?.url) {
          throw new Error(`Direct link missing (EP ${item.episode})`);
        }
        resolvedCount += 1;
        setProgress({ label: "Resolving direct links (Zap)...", value: resolvedCount, max: selectedLinks.length });
        return { episode: item.episode, directUrl: direct.content.url, kwik: item.kwikUrl };
      });

      const directMap: Record<string, { link: string; kwik: string }> = {};
      for (const r of resolved) {
        directMap[r.episode] = {
          link: r.directUrl,
          kwik: r.kwik,
        }
      }

      setProgress({ label: "Checking availability...", value: 0, max: selectedLinks.length });
      let probedCount = 0;
      await runPool(resolved, 3, async (item) => {
        const streamData = {
          "directUrl": item.directUrl,
          "referer": item.kwik
        }
        const proxied = "https://dl.gst-hunter.workers.dev/stream/" + toBase64Url(JSON.stringify(streamData));
        await probeUrl(proxied, controller.signal);
        probedCount += 1;
        setProgress({ label: "Checking availability...", value: probedCount, max: selectedLinks.length });
        return true;
      });

      const handle = await showSaveFilePicker({
        suggestedName: zipName,
        types: [{ description: "Zip", accept: { "application/zip": [".zip"] } }],
      });
      const fileStream = await handle.createWritable();

      let writeChain = Promise.resolve();
      let doneResolve: (() => void) | null = null;
      let doneReject: ((e: unknown) => void) | null = null;
      const done = new Promise<void>((resolve, reject) => {
        doneResolve = resolve;
        doneReject = reject;
      });

      const zip = new Zip((err, data, final) => {
        if (err) {
          controller.abort();
          doneReject?.(err);
          return;
        }
        writeChain = writeChain.then(() => fileStream.write(data as Uint8Array<ArrayBuffer>));
        if (final) {
          writeChain = writeChain
            .then(() => fileStream.close())
            .then(() => doneResolve?.(), (e: unknown) => doneReject?.(e));
        }
      });

      setProgress({ label: "Downloading & zipping...", value: 0, max: selectedLinks.length });

      for (let i = 0; i < selectedLinks.length; i++) {
        const { episode } = selectedLinks[i];
        setProgress({ label: `Downloading: EP ${episode}`, value: i, max: selectedLinks.length });

        const directUrl = directMap[episode];
        if (!directUrl) throw new Error(`Missing resolved URL (EP ${episode})`);

        const streamData = {
          "directUrl": directUrl.link,
          "referer": directUrl.kwik
        }
        const proxied = "https://dl.gst-hunter.workers.dev/stream/" + toBase64Url(JSON.stringify(streamData));
        const res = await fetch(proxied, { signal: controller.signal });
        if (!res.ok || !res.body) throw new Error(`Download failed (EP ${episode})`);

        const fileName = sanitizeFilename(`${safeSeries} - EP ${episode}.mp4`);
        const entry = new ZipPassThrough(fileName);
        zip.add(entry);

        const reader = res.body.getReader();
        let isReading = true;
        while (isReading) {
          const { done, value } = await reader.read();
          if (done) {
            isReading = false;
            break;
          }
          entry.push(value, false);
        }
        entry.push(new Uint8Array(0), true);
        setProgress({ label: `Added EP ${episode}`, value: i + 1, max: selectedLinks.length });
      }

      zip.end();
      await done;
      toast.success("Season zip saved");
    } catch (err) {
      if ((err instanceof DOMException && err.name === 'AbortError')) {
        toast.error(err?.message ?? "Season zip failed");
      }
    } finally {
      setZipping(false);
    }
  };

  const title = seriesName ? `Download: ${seriesName}` : "Download Season";

  return (
    <Modal
      backdrop="blur"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={!isPreparing && !isZipping}
      isKeyboardDismissDisabled={isPreparing || isZipping}
      size="lg"
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-2">
              <div className="text-center">{title}</div>
              <Checkbox isSelected={onlyCurrentPage} onValueChange={setOnlyCurrentPage} isDisabled={isPreparing || isZipping}>
                Only current page
              </Checkbox>
            </ModalHeader>
            <ModalBody>
              <Progress
                label={progress.label}
                value={progress.value}
                maxValue={progress.max}
                isIndeterminate={(isPreparing || isZipping) && progress.max <= 1}
              />

              <Select
                label="Common download option"
                placeholder={commonOptions.length ? "Select an option" : "No common option found"}
                selectedKeys={selectedOptionKey ? [selectedOptionKey] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string | undefined;
                  if (value) setSelectedOptionKey(value);
                }}
                isDisabled={isPreparing || isZipping || commonOptions.length === 0}
              >
                {commonOptions.map(({ key, label }) => (
                  <SelectItem key={key}>{label}</SelectItem>
                ))}
              </Select>

              <div className="text-sm text-default-500">
                Episodes: {episodes.length} • Ready: {selectedLinks.length === episodes.length && episodes.length > 0 ? "yes" : "no"}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={prepare} isDisabled={!seriesId || isPreparing || isZipping}>
                Refresh
              </Button>
              <Button color="primary" onPress={downloadZipZap} isDisabled={selectedLinks.length === 0 || isPreparing || isZipping}>
                Download Zip (Zap)
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default BulkDownloadModel;
