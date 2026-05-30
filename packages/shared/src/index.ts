export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  toolCalls?: ToolCallInfo[];
  productCards?: ProductCard[];
  quickReplies?: string[];
}

export interface ToolCallInfo {
  name: string;
  input: Record<string, unknown>;
  result: unknown;
}

export interface ProductCard {
  sku: string;
  name: string;
  category: ProductCategory;
  specs: Record<string, string | number>;
  imageUrl?: string;
}

export type ProductCategory = "case" | "psu" | "cooler" | "smart-screen";

export interface Session {
  id: string;
  createdAt: number;
  lastActiveAt: number;
  messages: Message[];
  context: SessionContext;
}

export interface SessionContext {
  productModel?: string;
  purchaseDate?: string;
  issueCategory?: string;
  collectedSlots: Record<string, string>;
}

export interface CompatibilityResult {
  compatible: boolean;
  reason: string;
  suggestions?: string[];
}

export interface ChatRequest {
  sessionId?: string;
  message: string;
}

export interface ChatResponse {
  sessionId: string;
  message: Message;
}
