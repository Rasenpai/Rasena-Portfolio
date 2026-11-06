import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

function build(lead: boolean): Components {
  return {
    h1: ({ children }) => (
      <h1 className="mb-4 mt-8 border-b border-[#8b6dff30] pb-2 text-2xl font-bold text-white first:mt-0 sm:text-3xl">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-3 mt-8 border-b border-[#8b6dff20] pb-2 text-xl font-bold text-white first:mt-0 sm:text-2xl">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-3 mt-6 text-lg font-semibold text-white first:mt-0 sm:text-xl">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="mb-2 mt-5 text-base font-semibold text-white first:mt-0 sm:text-lg">
        {children}
      </h4>
    ),
    p: ({ children }) => (
      <p
        className={
          lead
            ? "my-4 text-base leading-[1.75] text-[#cfc8ea] first:mt-0 last:mb-0 sm:text-lg"
            : "my-4 leading-[1.75] text-[#d8d2ee]"
        }
      >
        {children}
      </p>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="font-medium text-[#b58aff] underline-offset-2 hover:underline"
      >
        {children}
      </a>
    ),
    ul: ({ children }) => (
      <ul className="my-4 list-disc space-y-1.5 pl-6 text-[#d8d2ee] marker:text-[#8b9dff]">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="my-4 list-decimal space-y-1.5 pl-6 text-[#d8d2ee] marker:text-[#8b9dff]">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="leading-[1.7]">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="my-5 border-l-4 border-[#5b4dff] bg-[#14123a]/60 px-4 py-1 text-[#cfc8ea]">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-8 border-[#8b6dff30]" />,
    strong: ({ children }) => (
      <strong className="font-semibold text-white">{children}</strong>
    ),
    code: ({ children }) => (
      <code className="rounded-md bg-[#1a1240] px-1.5 py-0.5 font-mono text-[0.9em] text-[#c9bcff]">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="my-5 overflow-x-auto rounded-xl border border-[#8b6dff30] bg-[#0b0820] p-4 text-sm leading-relaxed text-[#e6e0f5] [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit">
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div className="my-5 overflow-x-auto rounded-xl border border-[#8b6dff30]">
        <table className="w-full border-collapse text-left text-sm">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-[#1a1240]">{children}</thead>,
    th: ({ children }) => (
      <th className="border-b border-[#8b6dff30] px-4 py-2.5 font-semibold text-white">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border-b border-[#8b6dff20] px-4 py-2.5 text-[#d8d2ee]">
        {children}
      </td>
    ),
    // Hanya izinkan gambar https; sisanya tidak dirender
    img: ({ src, alt }) =>
      typeof src === "string" && src.startsWith("https://") ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt ?? ""}
          loading="lazy"
          className="my-5 h-auto max-w-full rounded-xl border border-[#8b6dff30]"
        />
      ) : null,
  };
}

const docComponents = build(false);
const leadComponents = build(true);

// Markdown + HTML aman: HTML mentah diparse (rehype-raw) lalu disanitasi
// (rehype-sanitize), jadi script/iframe/style/onclick dibuang.
export default function MarkdownView({
  source,
  variant = "doc",
  breaks = false,
}: {
  source: string;
  variant?: "doc" | "lead";
  breaks?: boolean;
}) {
  return (
    <div className="min-w-0 break-words">
      <ReactMarkdown
        remarkPlugins={breaks ? [remarkGfm, remarkBreaks] : [remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={variant === "lead" ? leadComponents : docComponents}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
