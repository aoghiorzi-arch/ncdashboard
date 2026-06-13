import { Images, Upload, Search, Grid3X3, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const ASSETS = [
  { id: '1', name: 'Hero Banner — Summer', type: 'image', project: 'Q3 Launch', size: '2.4 MB', color: 'from-orange-400 to-pink-500' },
  { id: '2', name: 'Brand Video 60s', type: 'video', project: 'Brand', size: '48 MB', color: 'from-violet-500 to-purple-600' },
  { id: '3', name: 'Email Header Template', type: 'image', project: 'Email', size: '0.8 MB', color: 'from-blue-400 to-cyan-500' },
  { id: '4', name: 'Instagram Carousel Set', type: 'image', project: 'Q3 Launch', size: '3.1 MB', color: 'from-pink-400 to-rose-500' },
  { id: '5', name: 'Product Demo Reel', type: 'video', project: 'Content Hub', size: '120 MB', color: 'from-green-400 to-teal-500' },
  { id: '6', name: 'Podcast Cover Art', type: 'image', project: 'Brand', size: '1.2 MB', color: 'from-amber-400 to-orange-500' },
  { id: '7', name: 'Landing Page Copy v3', type: 'copy', project: 'Growth', size: '12 KB', color: 'from-indigo-400 to-violet-500' },
  { id: '8', name: 'Partner Badge Assets', type: 'image', project: 'Brand', size: '0.5 MB', color: 'from-slate-400 to-gray-500' },
];

const TYPE_BADGE: Record<string, string> = {
  image: 'bg-blue-50 text-blue-600',
  video: 'bg-purple-50 text-purple-600',
  copy: 'bg-green-50 text-green-600',
};

export default function AssetGallery() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl av-gradient-primary flex items-center justify-center">
            <Images className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Asset Gallery</h1>
            <p className="text-sm text-muted-foreground">{ASSETS.length} assets across 5 projects</p>
          </div>
        </div>
        <Button size="sm" className="gap-2 av-gradient-primary text-white border-0">
          <Upload className="w-3.5 h-3.5" /> Upload
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search assets…" className="pl-9 h-9 text-sm" />
        </div>
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <button className="p-2 bg-primary text-primary-foreground">
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-muted transition-colors text-muted-foreground">
            <LayoutList className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {ASSETS.map(asset => (
          <div
            key={asset.id}
            className="group cursor-pointer av-glass-card rounded-2xl overflow-hidden hover:av-shadow transition-all"
          >
            <div className={`h-32 bg-gradient-to-br ${asset.color} flex items-center justify-center relative`}>
              <span className="text-4xl opacity-40">
                {asset.type === 'image' ? '🖼️' : asset.type === 'video' ? '🎬' : '📝'}
              </span>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
            <div className="p-3">
              <p className="text-xs font-semibold text-foreground truncate mb-1">{asset.name}</p>
              <div className="flex items-center justify-between">
                <Badge className={`text-[10px] border-0 ${TYPE_BADGE[asset.type]}`}>{asset.type}</Badge>
                <span className="text-[10px] text-muted-foreground">{asset.size}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
