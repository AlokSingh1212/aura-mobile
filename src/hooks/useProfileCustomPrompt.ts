import { useState } from "react";

export function useProfileCustomPrompt() {
  const [promptVisible, setPromptVisible] = useState(false);
  const [promptTitle, setPromptTitle] = useState("");
  const [promptDesc, setPromptDesc] = useState("");
  const [promptPlaceholder, setPromptPlaceholder] = useState("");
  const [promptValue, setPromptValue] = useState("");
  const [promptOnSubmit, setPromptOnSubmit] = useState<((val: string) => void) | null>(null);

  const showCustomPrompt = (
    title: string,
    desc: string,
    placeholder: string,
    onSubmit: (val: string) => void
  ) => {
    setPromptTitle(title);
    setPromptDesc(desc);
    setPromptPlaceholder(placeholder);
    setPromptValue("");
    setPromptOnSubmit(() => onSubmit);
    setPromptVisible(true);
  };

  return {
    promptVisible,
    setPromptVisible,
    promptTitle,
    promptDesc,
    promptPlaceholder,
    promptValue,
    setPromptValue,
    promptOnSubmit,
    showCustomPrompt,
  };
}
