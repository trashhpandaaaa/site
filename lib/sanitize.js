// Sanitizes admin-authored rich text (react-quill HTML) so stored blog content
// can never execute script in a reader's browser. Allows the formatting Quill
// emits, but strips <script>, event handlers, <iframe>, and javascript: URLs.
// Used on write (admin posts API) and again on read (blog page) so even content
// saved before this existed is rendered safely.

import sanitizeHtml from "sanitize-html";

const OPTIONS = {
  allowedTags: [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "blockquote", "p", "a", "ul", "ol", "li",
    "b", "i", "strong", "em", "strike", "s", "u",
    "code", "pre", "hr", "br", "div", "span", "img"
  ],
  allowedAttributes: {
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    span: ["class"],
    div: ["class"],
    p: ["class"],
    code: ["class"],
    pre: ["class"],
    ol: ["start"],
    li: ["class"]
  },
  // No javascript:/data: anywhere; images come from our own https uploads.
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"] },
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      rel: "noopener noreferrer nofollow",
      target: "_blank"
    })
  }
};

export function sanitizeRichText(dirty) {
  if (!dirty) return "";
  return sanitizeHtml(dirty.toString(), OPTIONS);
}
