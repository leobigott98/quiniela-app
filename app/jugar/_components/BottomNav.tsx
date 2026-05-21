import Link from "next/link";

export function BottomNav({ active }: { active: "jugar" | "ranking" | "admin" }) {
  return (
    <nav className="nav">
      <Link className={active === "jugar" ? "active" : ""} href="/jugar">Jugar</Link>
      <Link className={active === "ranking" ? "active" : ""} href="/ranking">Ranking</Link>
      <Link className={active === "admin" ? "active" : ""} href="/admin">Admin</Link>
    </nav>
  );
}
