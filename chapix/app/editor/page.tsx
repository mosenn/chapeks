"use client";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

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

  const offset = useRef({ x: 0, y: 0 });

  const [newText, setNewText] = useState("");

  const handleAddImages = (files: FileList | null) => {
    if (!files) return;
    const newImages: ImageItemType[] = Array.from(files).map((file) => {
      const id = uuidv4();
      const preview = URL.createObjectURL(file);
      return {
        id,
        file,
        preview,
        position: { x: 100, y: 100 },
        size: 150,
        rotate: "0",
      };
    });
    setImages((prev) => [...prev, ...newImages]);
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

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="متن را وارد کنید"
          className="border px-2 py-1 rounded"
        />
        <button
          onClick={handleAddText}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          ➕ افزودن متن
        </button>
      </div>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleAddImages(e.target.files)}
      />

      <div className="relative w-full h-[600px] border border-gray-300 mt-4 bg-gray-100">
        {/* عکس‌ها */}
        {images.map((img) => (
          <div
            key={img.id}
            className="absolute"
            style={{ left: img.position.x, top: img.position.y }}
            onMouseDown={(e) => handleMouseDown(img.id, "image", e)}
            onClick={() => setSelectedId(img.id)}
          >
            <div
              className={`relative border-2 ${
                selectedId === img.id ? "border-blue-500" : "border-transparent"
              }`}
              style={{ width: img.size, height: img.size }}
            >
              <div
                className="absolute top-0 right-0 bg-white text-xs px-2 cursor-pointer border rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettingId((prev) => (prev === img.id ? null : img.id));
                }}
              >
                ⚙️
              </div>
              <Image
                src={img.preview}
                alt="img"
                width={img.size}
                height={img.size}
                className="object-contain w-full h-full"
                style={{ transform: `rotate(${img.rotate}deg)` }}
                draggable={false}
              />
              {showSettingId === img.id && (
                <div className="absolute bottom-0 left-0 w-full bg-white border-t p-2 text-sm space-y-2">
                  <div>
                    <label>📏 اندازه:</label>
                    <input
                      type="range"
                      min={50}
                      max={300}
                      value={img.size}
                      onChange={(e) =>
                        updateImageSetting(img.id, "size", +e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label>🔄 چرخش:</label>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={parseInt(img.rotate)}
                      onChange={(e) =>
                        updateImageSetting(img.id, "rotate", e.target.value)
                      }
                    />
                  </div>
                  <button
                    className="bg-red-500 text-white text-xs px-2 py-1 rounded"
                    onClick={() => handleDelete(img.id)}
                  >
                    🗑️ حذف
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* متون */}
        {texts.map((txt) => (
          <div
            key={txt.id}
            className="absolute cursor-move"
            style={{ left: txt.position.x, top: txt.position.y }}
            onMouseDown={(e) => handleMouseDown(txt.id, "text", e)}
            onClick={() => setSelectedId(txt.id)}
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
                className="absolute top-0 right-0 bg-white text-xs px-1 py-0.5 border rounded cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettingId((prev) => (prev === txt.id ? null : txt.id));
                }}
              >
                ⚙️
              </div>

              {showSettingId === txt.id && (
                <div className="absolute bottom-0 left-0 bg-white p-2 text-sm border rounded space-y-2">
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
                    className="bg-red-500 text-white text-xs px-2 py-1 rounded"
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

export default Editor;
