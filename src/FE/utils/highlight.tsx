import React from 'react';

/**
 * 高亮文本中的搜索关键词
 * @param text 原始文本
 * @param searchTerm 搜索关键词
 * @returns 返回带有高亮标记的 React 元素
 */
export function highlightText(text: string, searchTerm: string): React.ReactNode {
  if (!searchTerm || !text) {
    return text;
  }

  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        if (part.toLowerCase() === searchTerm.toLowerCase()) {
          return (
            <mark
              key={index}
              className="bg-yellow-200 dark:bg-yellow-800 text-inherit rounded-sm px-0.5"
            >
              {part}
            </mark>
          );
        }
        return part;
      })}
    </>
  );
}

/**
 * 转义正则表达式中的特殊字符
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
