import { Editor } from "@tiptap/react";
import { BiPaintRoll } from "react-icons/bi";
import styles from "./ColorPicker.module.css";

const colors = [
  { name: "Черный", value: "#000000" },
  { name: "Серый", value: "#666666" },
  { name: "Красный", value: "#FF0000" },
  { name: "Синий", value: "#0000FF" },
  { name: "Зеленый", value: "#00FF00" },
  // Добавьте другие цвета по необходимости
];

interface ColorPickerProps {
  editor: Editor;
  className?: string;
}

export const ColorPicker = ({ editor, className }: ColorPickerProps) => {
  const handleColorChange = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };

  return (
    <div className={styles.colorPicker}>
      <button className={className}>
        <BiPaintRoll size={16} />
      </button>
      <div className={styles.colorPanel}>
        {colors.map((color) => (
          <button
            key={color.value}
            onClick={() => handleColorChange(color.value)}
            className={styles.colorButton}
            style={{ backgroundColor: color.value }}
            title={color.name}
            aria-label={color.name}
          />
        ))}
      </div>
    </div>
  );
}; 