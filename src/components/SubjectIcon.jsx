import {
  Ruler, Monitor, PenLine, Landmark, Clapperboard,
  Building2, Layers, Lightbulb, Armchair, Globe,
  Palette, BookMarked, BookOpen
} from 'lucide-react'

const ICON_MAP = {
  Ruler, Monitor, PenLine, Landmark, Clapperboard,
  Building2, Layers, Lightbulb, Armchair, Globe,
  Palette, BookMarked,
}

export default function SubjectIcon({ icon, size = 20, color, style, className }) {
  const Icon = ICON_MAP[icon] || BookOpen
  return <Icon size={size} color={color} style={style} className={className} />
}
