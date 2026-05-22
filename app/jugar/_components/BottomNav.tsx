import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";

export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  return (
    <nav className="bottom-nav">
      {isAdmin ? (
        <Link href="/admin">Admin</Link>
      ) : (
        <Link href="/jugar">Jugar</Link>
      )}
      <Link href="/ranking">Ranking</Link>
      <form action={signOutAction}>
        <button type="submit">Salir</button>
      </form>
    </nav>
  );
}
