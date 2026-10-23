export interface Texture {
  id: string;
  name: string;
  path?: string;
}

export const TEXTURES: Texture[] = [
  { id: "none", name: "None" },
  { id: "paper", name: "Paper", path: "/textures/paper.webp" },
  { id: "fabric", name: "Fabric", path: "/textures/fabric.webp" },
  { id: "concrete", name: "Concrete", path: "/textures/concrete.webp" },
  { id: "wood", name: "Wood", path: "/textures/wood.webp" },
  { id: "metal", name: "Metal", path: "/textures/metal.webp" },
];
