import { notFound } from "next/navigation";

import BlogComments from "../BlogComments";
import SiteNav from "../../components/SiteNav";
import { getBlogComments, getBlogPostBySlug } from "../../../lib/supabase/queries";
import { sanitizeRichText } from "../../../lib/sanitize";

export const dynamic = "force-dynamic";

export default async function BlogPostPage({ params }) {
	const post = await getBlogPostBySlug(params.slug);

	if (!post) {
		notFound();
	}

	const comments = await getBlogComments(post.id);

	return (
		<>
		<SiteNav />
		<main className="section" style={{ paddingTop: 104 }}>
			<div className="container">
				<article className="bento-card blog-article">
					<div className="tr-num">
						<span>{post.author_name || "KastoChha"}</span>
						<span>{post.reading_time ? `${post.reading_time} min read` : "Blog post"}</span>
					</div>
					<h1 className="page-title" style={{ marginTop: 12 }}>{post.title}</h1>
					<p className="page-sub">{post.excerpt || post.seo_description}</p>
					<div
						className="tr-desc blog-content"
						style={{ marginTop: 24 }}
						// Content is sanitized on write and again here, so any HTML
						// stored before sanitization existed is also rendered safely.
						dangerouslySetInnerHTML={{ __html: sanitizeRichText(post.content) }}
					/>
				</article>

				<BlogComments postId={post.id} initialComments={comments} />
			</div>
		</main>
		</>
	);
}
