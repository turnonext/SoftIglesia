import { redirect } from "next/navigation";

/** Punto de entrada público: toda la landing y el login viven en /login */
export default function Home() {
  redirect("/login");
}
