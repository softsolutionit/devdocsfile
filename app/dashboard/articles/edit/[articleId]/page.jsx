import EditArticle from "./_components/EditArticle";


export default async function EditArticlePage({ params }) {
  const { articleId } = await params;
  return <EditArticle articleId={articleId} />;
}