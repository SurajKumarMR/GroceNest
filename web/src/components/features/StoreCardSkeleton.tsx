
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function StoreCardSkeleton() {
    return (
        <Card className="overflow-hidden h-full flex flex-col border-0 shadow-md">
            <div className="relative h-48 w-full">
                <Skeleton className="h-full w-full" />
            </div>
            <CardHeader className="p-4 pb-0 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-3 flex-grow space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-4 pt-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-12" />
                </div>
            </CardContent>
        </Card>
    )
}
