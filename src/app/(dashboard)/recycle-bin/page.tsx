import { Heading } from "@/components/ui/heading"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/Button"
import { Trash2, RefreshCw } from "lucide-react"

// export const metadata = {
//     title: "Recycle Bin",
//     description: "Manage your deleted presentations"
// }

const RecycleBinPage = () => {
    const handleRestore = (id: string) => {
        // TODO: Implement restore functionality
    }

    const handlePermanentDelete = (id: string) => {
        // TODO: Implement permanent delete functionality
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <Heading
                    title="Recycle Bin"
                    description="Restore or permanently delete your presentations"
                />
            </div>

            <div className="grid gap-4 grid-cols-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Q4 Sales Presentation</CardTitle>
                        <CardDescription>Deleted on April 1, 2024</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Last modified: March 31, 2024
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore("1")}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Restore
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handlePermanentDelete("1")}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Permanently
                        </Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Project Proposal</CardTitle>
                        <CardDescription>Deleted on March 30, 2024</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Last modified: March 29, 2024
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore("2")}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Restore
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handlePermanentDelete("2")}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Permanently
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

export default RecycleBinPage 