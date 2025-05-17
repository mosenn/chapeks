"use client";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
// import html2canvas from "html2canvas";
import html2canvas from "html2canvas";
type ImageItemType = {
  id: string;
  file: File;
  preview: string;
  position: { x: number; y: number };
  size: number;
  rotate: string;
};

type TextItemType = {
  id: string;
  text: string;
  position: { x: number; y: number };
  fontSize: number;
  color: string;
  fontFamily: string;
};

const Editor = () => {
  const [images, setImages] = useState<ImageItemType[]>([]);
  const [texts, setTexts] = useState<TextItemType[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragType, setDragType] = useState<"image" | "text" | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSettingId, setShowSettingId] = useState<string | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);

  const [controlExportMain, setControlExportMain] = useState({
    size: "",
    bg: "",
  });
  type ZIndexMap = Record<string, number>;
  const [zIndexes, setZIndexes] = useState<ZIndexMap>({});
  const zCounter = useRef(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  const bringToFront = (id: string) => {
    setZIndexes((prev) => ({
      ...prev,
      [id]: zCounter.current++,
    }));
  };
  const offset = useRef({ x: 0, y: 0 });

  const [newText, setNewText] = useState("");
  const selectedImage = images.find((img) => img.id === selectedId);

  const handleExport = async () => {
    if (!canvasRef.current) return;

    const canvas = await html2canvas(canvasRef.current, {
      backgroundColor: null, // شفاف بودن پس‌زمینه
      useCORS: true, // برای بارگذاری تصاویر از URLهای blob
    });

    const dataUrl = canvas.toDataURL("image/png");

    // دانلود عکس
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "output.png";
    link.click();
  };
  const handleAddImages = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const preview = e.target?.result as string;
        const img = new window.Image();

        img.onload = () => {
          const id = uuidv4();
          const newImage: ImageItemType = {
            id,
            file,
            preview,
            position: { x: 100, y: 100 },
            size: img.width, // واقعی‌ترین عرض تصویر
            rotate: "0",
          };
          setImages((prev) => [...prev, newImage]);
        };

        img.src = preview;
      };

      reader.readAsDataURL(file);
    });
  };

  const handleAddText = () => {
    if (!newText.trim()) return;
    const id = uuidv4();
    const newTextItem: TextItemType = {
      id,
      text: newText,
      position: { x: 100, y: 100 },
      fontSize: 20,
      color: "#000000",
      fontFamily: "Arial",
    };
    setTexts((prev) => [...prev, newTextItem]);
    setNewText("");
  };

  const handleMouseDown = (
    id: string,
    type: "image" | "text",
    e: React.MouseEvent
  ) => {
    // جلوگیری از شروع درگ روی input, slider و ...
    const target = e.target as HTMLElement;
    if (
      ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "LABEL"].includes(
        target.tagName
      )
    ) {
      return;
    }

    setDraggingId(id);
    setDragType(type);

    const item =
      type === "image"
        ? images.find((img) => img.id === id)
        : texts.find((txt) => txt.id === id);

    if (!item) return;

    offset.current = {
      x: e.clientX - item.position.x,
      y: e.clientY - item.position.y,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingId || !dragType) return;

    const newPosition = {
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
    };

    if (dragType === "image") {
      setImages((prev) =>
        prev.map((img) =>
          img.id === draggingId ? { ...img, position: newPosition } : img
        )
      );
    } else {
      setTexts((prev) =>
        prev.map((txt) =>
          txt.id === draggingId ? { ...txt, position: newPosition } : txt
        )
      );
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setDragType(null);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [draggingId, dragType, selectedId]);

  const handleDelete = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setTexts((prev) => prev.filter((txt) => txt.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Delete" && selectedId) {
      handleDelete(selectedId);
    }
  };

  const updateImageSetting = (
    id: string,
    key: "size" | "rotate",
    value: number | string
  ) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, [key]: value } : img))
    );
  };

  const updateTextSetting = (
    id: string,
    key: "fontSize" | "color" | "fontFamily",
    value: string | number
  ) => {
    setTexts((prev) =>
      prev.map((txt) => (txt.id === id ? { ...txt, [key]: value } : txt))
    );
  };
  const handleBackgourdColorMain = (e) => {
    console.log(e.target.value, "color");
    setControlExportMain({
      ...controlExportMain,
      bg: e.target.value,
    });
  };

  const [selectedProduct, setSelectedProduct] = useState("کاتالوگ");
  const [customSize, setCustomSize] = useState({ width: "", height: "" });

  // const size = productSizes[selectedProduct];

  const isCustom = selectedProduct === "سفارشی";
  const size = isCustom
    ? {
        width: Number(customSize.width) || 0,
        height: Number(customSize.height) || 0,
      }
    : productSizes[selectedProduct];
  return (
    <div className="p-4 space-y-4">
      <header>
        {/* add txt , export button */}
        <div>
          <button
            onClick={() => setShowTextInput((prev) => !prev)}
            className="w-8 h-8 flex items-center justify-center  rounded-full text-lg"
          >
            A
          </button>

          <button onClick={handleExport} className="px-3 py-1 rounded">
            📤 خروجی گرفتن (تصویر)
          </button>
        </div>
        {/* show input text in header */}
        {showTextInput && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="متن را وارد کنید"
              className="border px-2 py-1 rounded"
            />
            <button onClick={handleAddText} className=" px-3 py-1 rounded">
              ➕
            </button>
          </div>
        )}
        {/* file input */}
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => {
            handleAddImages(e.target.files);
            e.target.value = ""; // بدون این خط، فایل تکراری مجدد انتخاب نمی‌شه
          }}
        />
        {/* color input */}
        <input type="color" onChange={handleBackgourdColorMain} />
        <select
          className="border rounded p-2"
          onChange={(e) => setSelectedProduct(e.target.value)}
          value={selectedProduct}
        >
          {Object.keys(productSizes).map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
        {isCustom && (
          <div className="space-x-2">
            <input
              type="number"
              placeholder="عرض (px)"
              className="border p-2 rounded"
              value={customSize.width}
              onChange={(e) =>
                setCustomSize({ ...customSize, width: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="ارتفاع (px)"
              className="border p-2 rounded"
              value={customSize.height}
              onChange={(e) =>
                setCustomSize({ ...customSize, height: e.target.value })
              }
            />
          </div>
        )}
      </header>
      {/* main for text , img and this exported */}
      <div
        ref={canvasRef}
        className={`relative border`}
        style={{
          backgroundColor: controlExportMain.bg,
          padding: "15px",
          margin: "15px",
          width: `${size.width}px`,
          height: `${size.height}px`,
          transition: "all 0.3s ease",
        }}
      >
        {/* عکس‌ها */}
        {images.map((img) => (
          <div
            key={img.id}
            className="absolute"
            style={{
              left: img.position.x,
              top: img.position.y,
              zIndex: zIndexes[img.id] || 1,
              width: img.size,
            }}
            onMouseDown={(e) => handleMouseDown(img.id, "image", e)}
            onClick={() => {
              setSelectedId(img.id);
              bringToFront(img.id);
            }}
          >
            <div
              className={`relative border-2 ${
                selectedId === img.id ? "" : "border-transparent"
              }`}
            >
              <div
                className="absolute top-0 z-[99999] right-0  text-xs px-2 cursor-pointer  rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(img.id);
                  setShowSettingId((prev) => (prev === img.id ? null : img.id));
                }}
              >
                ⚙️
              </div>
              <Image
                src={img.preview}
                alt="img"
                width={img.size}
                height={0}
                className="object-contain w-full h-auto"
                style={{
                  transform: `rotate(${img.rotate}deg)`,
                  width: `${img.size}`,
                }}
                draggable={false}
              />
            </div>
          </div>
        ))}
        {/* setting imgs */}
        {selectedImage && showSettingId === selectedImage.id && (
          <div
            className="fixed bottom-4 right-4 z-[99999] w-64  border rounded  p-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* تنظیمات */}
            <div>
              <label>📏 اندازه:</label>
              <input
                type="range"
                min={50}
                max={300}
                value={selectedImage.size}
                onChange={(e) =>
                  updateImageSetting(selectedImage.id, "size", +e.target.value)
                }
              />
            </div>
            <div>
              <label>🔄 چرخش:</label>
              <input
                type="range"
                min={0}
                max={360}
                value={parseInt(selectedImage.rotate)}
                onChange={(e) =>
                  updateImageSetting(selectedImage.id, "rotate", e.target.value)
                }
              />
            </div>
            <button
              className="text-xs px-2 py-1 rounded"
              onClick={() => handleDelete(selectedImage.id)}
            >
              🗑️ حذف
            </button>
          </div>
        )}

        {/* متون */}
        {texts.map((txt) => (
          <div
            key={txt.id}
            className="absolute cursor-move"
            style={{
              left: txt.position.x,
              top: txt.position.y,
              zIndex: zIndexes[txt.id] || 1, // اضافه کن
            }}
            onMouseDown={(e) => handleMouseDown(txt.id, "text", e)}
            onClick={() => {
              setSelectedId(txt.id);
              bringToFront(txt.id); // اضافه کن
            }}
          >
            <div className="relative">
              <p
                style={{
                  fontSize: txt.fontSize,
                  color: txt.color,
                  fontFamily: txt.fontFamily,
                }}
              >
                {txt.text}
              </p>

              <div
                className="absolute top-0  right-0  text-xs px-1 py-0.5 border rounded cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettingId((prev) => (prev === txt.id ? null : txt.id));
                }}
              >
                ⚙️
              </div>

              {showSettingId === txt.id && (
                <div className="absolute left-full top-0 ml-2 w-48  p-2 text-sm border rounded space-y-2 shadow-lg z-50">
                  <div>
                    <label>🔠 سایز فونت:</label>
                    <input
                      type="range"
                      min={12}
                      max={100}
                      value={txt.fontSize}
                      onChange={(e) =>
                        updateTextSetting(txt.id, "fontSize", +e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label>🎨 رنگ:</label>
                    <input
                      type="color"
                      value={txt.color}
                      onChange={(e) =>
                        updateTextSetting(txt.id, "color", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label>🖋️ فونت:</label>
                    <select
                      value={txt.fontFamily}
                      onChange={(e) =>
                        updateTextSetting(txt.id, "fontFamily", e.target.value)
                      }
                    >
                      <option value="Arial">Arial</option>
                      <option value="Tahoma">Tahoma</option>
                      <option value="Courier New">Courier New</option>
                      <option value="IranSans">IranSans</option>
                    </select>
                  </div>
                  <button
                    className="text-xs px-2 py-1 rounded"
                    onClick={() => handleDelete(txt.id)}
                  >
                    🗑️ حذف
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
const productSizes = {
  کاتالوگ: { width: 2480, height: 3508 },
  "کارت ویزیت": { width: 1004, height: 650 },
  پاکت: { width: 2598, height: 1299 },
  فاکتور: { width: 1748, height: 2480 },
  تراکت: { width: 1240, height: 1748 },
  برچسب: { width: 591, height: 591 },
  سفارشی: { width: 0, height: 0 }, // مقدار اولیه
};
export default Editor;
