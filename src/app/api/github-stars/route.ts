// Visitors' browsers can't call the GitHub API directly: unauthenticated
// requests are capped at 60 an hour per IP, and past that the count shows 0.
// Fetch it here instead and cache it, so GitHub sees about one request an hour.
export const revalidate = 3600;

const REPO_API = "https://api.github.com/repos/CodewithEvilxd/flux-icons";

export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  try {
    const res = await fetch(REPO_API, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate },
    });
    if (!res.ok) return Response.json({ stars: null }, { status: 502 });
    const data = (await res.json()) as { stargazers_count?: number };
    return Response.json({ stars: data.stargazers_count ?? null });
  } catch {
    return Response.json({ stars: null }, { status: 502 });
  }
}
