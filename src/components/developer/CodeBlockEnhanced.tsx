import { useState } from "react";
import { Copy, CheckCircle, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodeBlockEnhancedProps {
  code: string;
  language: string;
  title?: string;
  showLineNumbers?: boolean;
  runnable?: boolean;
  onRun?: () => Promise<string | void>;
}

// Simple syntax highlighting for code blocks
const highlightCode = (code: string, language: string): string => {
  // Keywords for different languages
  const keywords: Record<string, string[]> = {
    javascript: ['const', 'let', 'var', 'function', 'async', 'await', 'return', 'import', 'from', 'export', 'if', 'else', 'try', 'catch', 'new', 'true', 'false', 'null', 'undefined'],
    python: ['def', 'class', 'import', 'from', 'return', 'if', 'else', 'elif', 'try', 'except', 'True', 'False', 'None', 'async', 'await', 'with', 'as'],
    php: ['function', 'class', 'public', 'private', 'protected', 'return', 'if', 'else', 'try', 'catch', 'new', 'use', 'namespace', 'true', 'false', 'null'],
    bash: ['npm', 'yarn', 'pip', 'composer', 'curl', 'install', 'add', 'require'],
    curl: ['curl', '-X', '-H', '-d', 'POST', 'GET', 'PUT', 'DELETE'],
  };

  return code;
};

export const CodeBlockEnhanced = ({ 
  code, 
  language, 
  title,
  showLineNumbers = true,
  runnable = false,
  onRun
}: CodeBlockEnhancedProps) => {
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = async () => {
    if (!onRun) return;
    setIsRunning(true);
    setOutput(null);
    try {
      const result = await onRun();
      if (result) setOutput(result);
    } catch (e) {
      setOutput(`Error: ${e}`);
    } finally {
      setIsRunning(false);
    }
  };

  const lines = code.split('\n');

  return (
    <div className="rounded-lg overflow-hidden border border-border bg-[#0d1117]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>
          {title && <span className="text-xs text-[#8b949e] font-mono">{title}</span>}
          <span className="text-xs text-secondary font-medium uppercase">{language}</span>
        </div>
        <div className="flex items-center gap-2">
          {runnable && onRun && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRun}
              disabled={isRunning}
              className="h-7 text-xs text-secondary hover:text-secondary/80 hover:bg-secondary/10"
            >
              {isRunning ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Play className="w-3 h-3 mr-1" />
              )}
              Exécuter
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={copyCode}
            className="h-7 text-xs text-[#8b949e] hover:text-white hover:bg-[#30363d]"
          >
            {copied ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1 text-emerald-500" />
                <span className="text-emerald-500">Copié!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                Copier
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto">
        <pre className="p-4 text-sm leading-relaxed">
          <code className="text-[#c9d1d9]">
            {showLineNumbers ? (
              lines.map((line, i) => (
                <div key={i} className="flex">
                  <span className="w-8 text-right pr-4 text-[#484f58] select-none text-xs">
                    {i + 1}
                  </span>
                  <span className="flex-1">{line}</span>
                </div>
              ))
            ) : (
              code
            )}
          </code>
        </pre>
      </div>

      {/* Output panel */}
      {output && (
        <div className="border-t border-[#30363d] bg-[#0d1117]">
          <div className="px-4 py-2 bg-[#161b22] text-xs text-[#8b949e] flex items-center gap-2">
            <span className="text-secondary">→</span> Résultat
          </div>
          <pre className="p-4 text-sm text-emerald-400 overflow-x-auto">
            <code>{output}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
