import { useState } from "react";

const EXTS = ["png", "jpg", "jpeg", "webp"];

/** Shows /diagrams/<name>.<ext> (tries png, jpg, jpeg, webp). `name` may be a string or an array
 * of alternative file names. Renders `fallback` (or a small grey label) if no file is found, so the
 * form still works before every picture has been added to public/diagrams/. */
export default function Photo({ name, alt = "", className = "", fallback = null }) {
  const files = (Array.isArray(name) ? name : [name]).flatMap((n) => EXTS.map((e) => `${n}.${e}`));
  const [i, setI] = useState(0);
  if (i >= files.length) return fallback ?? <div className="photo-missing">{alt}</div>;
  return <img src={`/diagrams/${files[i]}`} alt={alt} className={className} onError={() => setI(i + 1)} />;
}
