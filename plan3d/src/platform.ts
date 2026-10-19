// Enregistrement de fichiers : via la capacité « downloads » quand l'application
// tourne dans claude.ai (où les téléchargements directs sont bloqués), sinon via
// un lien de téléchargement classique.

interface DownloadsApi {
  save(req: { filename: string; data: Blob | string }): Promise<unknown>;
}
interface ClaudeHost {
  use(name: 'downloads'): Promise<DownloadsApi | null>;
}

export type SaveOutcome = 'saved' | 'declined' | 'failed';

export async function saveFile(filename: string, data: Blob | string): Promise<SaveOutcome> {
  const host = (window as unknown as { claude?: ClaudeHost }).claude;
  if (host?.use) {
    const downloads = await host.use('downloads').catch(() => null);
    if (downloads) {
      try {
        await downloads.save({ filename, data });
        return 'saved';
      } catch (e) {
        return (e as { code?: string })?.code === 'declined' ? 'declined' : 'failed';
      }
    }
  }
  const blob = typeof data === 'string' ? new Blob([data], { type: 'application/json' }) : data;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  return 'saved';
}

export const slug = (name: string) => name.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase().replace(/^-|-$/g, '') || 'plan';
