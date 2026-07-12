import { redirect } from "next/navigation";

// The blog section folded into Featured — the news front page. Individual
// articles still live at /blog/[slug]; only the index moved.
export default function BlogIndexRedirect() {
  redirect("/featured");
}
