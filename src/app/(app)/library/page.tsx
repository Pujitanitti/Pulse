import { requireUser } from "@/lib/auth/require-user";
import { listSavedArticles, listFolders } from "@/server/services/library";
import { listSavedArticlesQuerySchema } from "@/server/validation/library";
import { LibraryBoard } from "@/components/library/library-board";

export default async function LibraryPage() {
  const user = await requireUser();
  const [items, folders] = await Promise.all([
    listSavedArticles(user.id, listSavedArticlesQuerySchema.parse({})),
    listFolders(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
        <p className="text-sm text-foreground/50">Everything you&apos;ve saved, organized your way.</p>
      </div>
      <LibraryBoard initial={items} folders={folders} />
    </div>
  );
}
