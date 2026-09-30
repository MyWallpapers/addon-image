import type { CanvasAddonMountContext } from "../generated/mywallpaper-runtime";
import { bind } from "./bindings";
import "./style.css";
export function mount(context: CanvasAddonMountContext) {
  const node = document.createElement("div");
  node.className = "surface";
  const image = document.createElement("img");
  image.className = "still";
  image.alt = "";
  image.decoding = "async";
  const status = document.createElement("p");
  status.className = "image-status";
  status.setAttribute("role", "status");
  status.hidden = true;
  node.append(image, status);
  context.layer.root.replaceChildren(node);
  let alive = true,
    generation = 0,
    pending: HTMLImageElement | undefined;
  const fail = () => {
    status.textContent = "Image indisponible : vérifiez votre ressource.";
    status.hidden = false;
  };
  const stop = bind(context, (values) => {
    image.style.objectFit = values.fit === "contain" ? "contain" : "cover";
    image.style.objectPosition =
      Number(values.positionX ?? 50) +
      "% " +
      Number(values.positionY ?? 50) +
      "%";
    const ticket = ++generation,
      value = values.image;
    const resolved =
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      value.kind === "live" &&
      typeof value.url === "string"
        ? context.layer.resources.resolve({ kind: "live", url: value.url })
        : Promise.resolve(
            new URL("../assets/study.webp", import.meta.url).href,
          );
    if (pending) {
      pending.onload = pending.onerror = null;
      pending.removeAttribute("src");
    }
    void resolved
      .then((url) => {
        if (!alive || ticket !== generation) return;
        const loader = new Image();
        pending = loader;
        loader.onload = () => {
          if (!alive || ticket !== generation) return;
          image.src = url;
          status.hidden = true;
          loader.onload = loader.onerror = null;
          pending = undefined;
        };
        loader.onerror = () => {
          if (alive && ticket === generation) fail();
          loader.onload = loader.onerror = null;
          pending = undefined;
        };
        loader.src = url;
      })
      .catch(() => {
        if (alive && ticket === generation) fail();
      });
  });
  return () => {
    alive = false;
    generation++;
    stop();
    if (pending) {
      pending.onload = pending.onerror = null;
      pending.removeAttribute("src");
    }
    image.removeAttribute("src");
    node.remove();
  };
}
