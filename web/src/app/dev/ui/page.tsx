import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SpeechBubble } from "@/components/ui/speech-bubble";
import { ComponentShowcase } from "../_components/component-showcase";
import { PreviewSection } from "../_components/preview-section";

export default function UIPreviewPage() {
  return (
    <>
      <h1 className="text-3xl font-bold text-mirai-text mb-8">UI Primitives</h1>

      <ComponentShowcase title="Button" description="@/components/ui/button">
        <PreviewSection label="Variants">
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Default</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </PreviewSection>
        <PreviewSection label="Sizes">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">I</Button>
          </div>
        </PreviewSection>
        <PreviewSection label="Disabled">
          <div className="flex flex-wrap gap-3">
            <Button disabled>Disabled</Button>
            <Button variant="outline" disabled>
              Disabled Outline
            </Button>
          </div>
        </PreviewSection>
      </ComponentShowcase>

      <ComponentShowcase title="Badge" description="@/components/ui/badge">
        <PreviewSection label="Variants">
          <div className="flex flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="muted">Muted</Badge>
            <Badge variant="dark">Dark</Badge>
            <Badge variant="light">Light</Badge>
          </div>
        </PreviewSection>
      </ComponentShowcase>

      <ComponentShowcase title="Card" description="@/components/ui/card">
        <PreviewSection label="Basic">
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle>カードタイトル</CardTitle>
              <CardDescription>カードの説明文</CardDescription>
            </CardHeader>
            <CardContent>
              <p>カードのコンテンツがここに入ります。</p>
            </CardContent>
            <CardFooter>
              <Button size="sm">アクション</Button>
            </CardFooter>
          </Card>
        </PreviewSection>
      </ComponentShowcase>

      <ComponentShowcase
        title="SpeechBubble"
        description="@/components/ui/speech-bubble"
      >
        <PreviewSection label="Tail Positions">
          <div className="flex flex-wrap gap-8 items-start">
            <SpeechBubble tailPosition="bottom" className="max-w-xs">
              Bottom tail (default)
            </SpeechBubble>
            <SpeechBubble tailPosition="top" className="max-w-xs">
              Top tail
            </SpeechBubble>
            <SpeechBubble tailPosition="left" className="max-w-xs">
              Left tail
            </SpeechBubble>
            <SpeechBubble tailPosition="right" className="max-w-xs">
              Right tail
            </SpeechBubble>
          </div>
        </PreviewSection>
        <PreviewSection label="Tail Alignment">
          <div className="flex flex-wrap gap-8 items-start">
            <SpeechBubble tailPosition="bottom" tailAlign="start">
              Start
            </SpeechBubble>
            <SpeechBubble tailPosition="bottom" tailAlign="center">
              Center
            </SpeechBubble>
            <SpeechBubble tailPosition="bottom" tailAlign="end">
              End
            </SpeechBubble>
          </div>
        </PreviewSection>
      </ComponentShowcase>
    </>
  );
}
