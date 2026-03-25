
import Link from 'next/link';
import { Star, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store } from '@/types';
import Image from 'next/image';

interface StoreCardProps {
    store: Store;
}

export function StoreCard({ store }: StoreCardProps) {
    return (
        <Link href={`/stores/${store.slug}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col group border-0 shadow-md">
                <div className="relative h-48 w-full bg-muted overflow-hidden">
                    {store.coverPhotoUrl ? (
                        <Image
                            src={store.coverPhotoUrl}
                            alt={store.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full bg-slate-200 dark:bg-slate-800 text-muted-foreground">
                            <span className="text-4xl font-bold opacity-20">{store.name.charAt(0)}</span>
                        </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white dark:bg-black/80 backdrop-blur px-2 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        {store.averageRating.toFixed(1)}
                    </div>
                </div>

                <CardHeader className="p-4 pb-0">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{store.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {store.cuisineTypes.slice(0, 3).map((type) => (
                            <Badge key={type} variant="secondary" className="text-[10px] px-2 h-5 font-normal">
                                {type}
                            </Badge>
                        ))}
                    </div>
                </CardHeader>

                <CardContent className="p-4 flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {store.description || 'Authentic products from around the world.'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>20-30 min</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{store.deliveryRadiusKm || 5} km</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
