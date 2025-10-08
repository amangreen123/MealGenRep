"use client"

import { useState, useRef } from "react"
import { Camera, Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const ImageIngredientUpload = ({ onIngredientIdentified }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [previewImage, setPreviewImage] = useState(null)
    const [error, setError] = useState(null)
    const fileInputRef = useRef(null)
    const cameraInputRef = useRef(null)

    const handleImageUpload = async (file) => {
        if (!file) return

        setIsLoading(true)
        setError(null)

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreviewImage(reader.result)
        }
        reader.readAsDataURL(file)

        // Send to backend
        const formData = new FormData()
        formData.append("image", file)

        try {
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5261"
            const response = await fetch(`${apiUrl}/identify-ingredient`, {
                method: "POST",
                body: formData,
            })

            const data = await response.json()

            if (data.success) {
                // Call parent callback with identified ingredient
                onIngredientIdentified(data.ingredient)

                // Close dialog after short delay
                setTimeout(() => {
                    setIsOpen(false)
                    setPreviewImage(null)
                }, 1500)
            } else {
                setError(data.message || "Could not identify ingredient in image")
            }
        } catch (err) {
            console.error("Error identifying ingredient:", err)
            setError("Failed to connect to server. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            handleImageUpload(file)
        }
    }

    const handleClose = () => {
        setIsOpen(false)
        setPreviewImage(null)
        setError(null)
        setIsLoading(false)
    }

    return (
        <>
            <Button
                className="camera-button bg-transparent hover:bg-[#ce7c1c]/20 text-[#ce7c1c] border-2 border-[#ce7c1c] transition-all duration-300 rounded-full"
                onClick={() => setIsOpen(true)}
                title="Identify ingredient from photo"
                style={{
                    position: "absolute",
                    right: "70px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    height: "36px",
                    width: "36px",
                    padding: "0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Camera className="h-4 w-4" />
            </Button>

            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-title text-center">
                            <span className="text-[#ce7c1c]">IDENTIFY</span> <span className="text-white">INGREDIENT</span>
                        </DialogTitle>
                        <DialogDescription className="text-gray-400 text-center font-terminal">
                            Take a photo or upload an image of a food ingredient
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        {/* Preview Area */}
                        {previewImage && (
                            <div className="relative rounded-lg overflow-hidden border-2 border-gray-700">
                                <img src={previewImage || "/placeholder.svg"} alt="Preview" className="w-full h-64 object-cover" />
                                {isLoading && (
                                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                        <div className="text-center">
                                            <Loader2 className="h-12 w-12 animate-spin text-[#ce7c1c] mx-auto mb-2" />
                                            <p className="text-white font-terminal">Identifying ingredient...</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-950/50 border border-red-800 rounded-lg p-3 text-center">
                                <p className="text-red-300 font-terminal text-sm">{error}</p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        {!previewImage && (
                            <div className="grid grid-cols-2 gap-4">
                                {/* Camera Button (Mobile) */}
                                <Button
                                    className="bg-[#ce7c1c] hover:bg-[#ce7c1c]/90 text-white font-terminal h-24 flex flex-col items-center justify-center gap-2"
                                    onClick={() => cameraInputRef.current?.click()}
                                    disabled={isLoading}
                                >
                                    <Camera className="h-8 w-8" />
                                    <span>Take Photo</span>
                                </Button>

                                {/* Upload Button */}
                                <Button
                                    className="bg-gray-700 hover:bg-gray-600 text-white font-terminal h-24 flex flex-col items-center justify-center gap-2"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isLoading}
                                >
                                    <Upload className="h-8 w-8" />
                                    <span>Upload Image</span>
                                </Button>
                            </div>
                        )}

                        {/* Try Again Button */}
                        {previewImage && !isLoading && (
                            <Button
                                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-terminal"
                                onClick={() => {
                                    setPreviewImage(null)
                                    setError(null)
                                }}
                            >
                                Try Another Image
                            </Button>
                        )}
                    </div>

                    {/* Hidden file inputs */}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}

export default ImageIngredientUpload
