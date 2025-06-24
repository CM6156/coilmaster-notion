import React from "react";
import { ExcelNotionEditor } from "./excel-notion-editor";

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "내용을 입력하세요. '/' 를 입력하면 블록 메뉴, '@' 를 입력하면 Excel 스타일 테이블이 나타납니다.",
  height = 400,
  disabled = false
}) => {
  return (
    <ExcelNotionEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      height={height}
      disabled={disabled}
    />
  );
}; 