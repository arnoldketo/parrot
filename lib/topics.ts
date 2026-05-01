// =============================================================================
// Topic System
//
// Each topic defines:
//   - What data it needs
//   - How to calculate the personal impact
//   - The prompt template for Claude
//
// This is the core of Parrot's extensibility. Adding a new topic means
// adding a new entry here — the API route and dashboard handle the rest.
// =============================================================================

export interface TopicMeta {
    id: string;
    slug: string;
    title: string;
    subtitle: string;
    icon: string;
    domains: string[]; // e.g. ["energy", "transport"] — for future filtering
  }
  
  export const TOPICS: TopicMeta[] = [
    {
      id: "fuel",
      slug: "fuel",
      title: "Your Fuel Costs",
      subtitle: "How the oil crisis hits your tank",
      icon: "⛽",
      domains: ["energy", "transport"],
    },
    {
      id: "food",
      slug: "food",
      title: "Your Food Shop",
      subtitle: "How oil prices drive up your groceries",
      icon: "🛒",
      domains: ["food", "inflation"],
    },
  ];
  
  export function getTopicById(id: string): TopicMeta | undefined {
    return TOPICS.find((t) => t.id === id);
  }