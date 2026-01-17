export const toBase64Url = (str: string) => {
  const base64 = btoa(new TextEncoder().encode(str).reduce((data, byte) => data + String.fromCharCode(byte), ''));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
