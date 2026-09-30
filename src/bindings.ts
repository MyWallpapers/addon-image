import type {
  CanvasAddonMountContext,
  AddonValues,
} from "../generated/mywallpaper-runtime";
export function bind(
  context: CanvasAddonMountContext,
  render: (values: AddonValues) => void,
): () => void {
  render(context.layer.settings.get());
  return context.layer.settings.subscribe(render);
}
