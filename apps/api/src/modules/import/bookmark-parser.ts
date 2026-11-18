export interface ParsedBookmark {
  title: string;
  url: string;
  addDate?: number;
  icon?: string;
}

export interface ParsedFolder {
  name: string;
  children: (ParsedBookmark | ParsedFolder)[];
}

export interface ParseResult {
  bookmarks: ParsedBookmark[];
  folders: ParsedFolder[];
  totalCount: number;
}

export function parseBookmarkHtml(html: string): ParseResult {
  // Simple regex/string-based parser for Netscape bookmark format
  // The HTML format looks like:
  // <DL><p>
  //   <DT><H3>Folder Name</H3>
  //   <DL><p>
  //     <DT><A HREF="url" ADD_DATE="timestamp" ICON="data:...">Title</A>
  //   </DL><p>
  // </DL><p>

  const bookmarks: ParsedBookmark[] = [];
  const folders: ParsedFolder[] = [];

  // Parse line by line
  const lines = html.split('\n').map(l => l.trim()).filter(Boolean);

  const folderStack: ParsedFolder[] = [];
  let currentFolder: ParsedFolder | null = null;

  for (const line of lines) {
    // Match folder header: <DT><H3 ...>Folder Name</H3>
    const folderMatch = line.match(/<DT><H3[^>]*>(.+?)<\/H3>/i);
    if (folderMatch) {
      const newFolder: ParsedFolder = {
        name: decodeHtmlEntities(folderMatch[1]),
        children: [],
      };
      if (currentFolder) {
        currentFolder.children.push(newFolder);
        folderStack.push(currentFolder);
      } else {
        folders.push(newFolder);
      }
      currentFolder = newFolder;
      continue;
    }

    // Match bookmark: <DT><A HREF="url" ADD_DATE="ts" ICON="icon">Title</A>
    const bookmarkMatch = line.match(/<DT><A\s+HREF="([^"]+)"([^>]*)>(.+?)<\/A>/i);
    if (bookmarkMatch) {
      const url = bookmarkMatch[1];
      const attrs = bookmarkMatch[2];
      const title = decodeHtmlEntities(bookmarkMatch[3]);

      const addDateMatch = attrs.match(/ADD_DATE="(\d+)"/i);
      const iconMatch = attrs.match(/ICON="([^"]+)"/i);

      const bookmark: ParsedBookmark = {
        title,
        url,
        addDate: addDateMatch ? parseInt(addDateMatch[1]) : undefined,
        icon: iconMatch ? iconMatch[1] : undefined,
      };

      bookmarks.push(bookmark);
      if (currentFolder) {
        currentFolder.children.push(bookmark);
      }
      continue;
    }

    // Match closing DL tag - go back up the folder stack
    if (line.match(/<\/DL>/i)) {
      currentFolder = folderStack.pop() || null;
    }
  }

  return { bookmarks, folders, totalCount: bookmarks.length };
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec)));
}
