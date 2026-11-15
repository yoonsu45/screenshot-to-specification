export async function optimizeImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일을 선택해 주세요.");
  }

  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  // Poster dates and venue names are often rendered in small type. Keep substantially
  // more source detail than the preview used to, and gently upscale small screenshots.
  const maxSide = 2400;
  const scale = Math.min(1.5, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("이미지를 처리할 수 없어요.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  // PNG avoids JPEG ringing around thin Korean glyphs.
  return canvas.toDataURL("image/png");
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}
