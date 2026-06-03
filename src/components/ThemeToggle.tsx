import { Lightbulb, LightbulbOff } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 rounded-full transition-colors hover:bg-primary/10"
        title="Включить темную тему"
      >
        <Lightbulb className="absolute h-[1.15rem] w-[1.15rem] text-primary scale-100 opacity-100 rotate-0" />
        <LightbulbOff className="absolute h-[1.15rem] w-[1.15rem] text-muted-foreground scale-0 opacity-0 -rotate-90" />
        <span className="sr-only">Переключить тему</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-9 w-9 rounded-full transition-colors hover:bg-primary/10"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      title={theme === "light" ? "Включить темную тему" : "Включить светлую тему"}
    >
      <Lightbulb
        className={`absolute h-[1.15rem] w-[1.15rem] text-primary transition-all ${
          theme === "dark" ? "scale-0 opacity-0 rotate-90" : "scale-100 opacity-100 rotate-0"
        }`}
      />
      <LightbulbOff
        className={`absolute h-[1.15rem] w-[1.15rem] text-muted-foreground transition-all ${
          theme === "dark" ? "scale-100 opacity-100 rotate-0" : "scale-0 opacity-0 -rotate-90"
        }`}
      />
      <span className="sr-only">Переключить тему</span>
    </Button>
  );
}
