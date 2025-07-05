import { Box, Typography, Button } from "@mui/material";
import { useWallet } from "../contexts/WalletContext";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Gift as GiftIcon, Send, Download, User } from "lucide-react";
import GiftCardDetailsDialog from "@/components/GiftCardDetailsDialog";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserProfile, getDetailedProfile, GiftCard } from "@/utils/api";
import { API_BASE_URL } from "@/services/api";

interface UserStats {
  totalGiftCardsCreated: number;
  totalGiftCardsSent: number;
  totalGiftCardsReceived: number;
  totalBackgroundsMinted: number;
}

interface UserProfileData {
  username: string;
  stats: UserStats;
}

interface MappedGiftCard {
  id: string;
  imageUrl: string;
  senderName: string;
  recipientName: string;
  message: string;
  amount: string;
  date: string;
  status: "Sent" | "Received";
}

interface GiftCardItemProps {
  gift: MappedGiftCard;
}

const getImageUrl = (imageURI: string): string => {
  if (imageURI.startsWith("http")) {
    return imageURI; // S3 URL
  }
  // Convert Windows backslashes to forward slashes
  const normalizedPath = imageURI.replace(/\\\\/g, "/").replace(/\\/g, "/");
  // Remove any leading slashes to avoid double slashes in the URL
  const cleanPath = normalizedPath.replace(/^\/+/, "");
  // Construct the full URL using API_BASE_URL
  const fullUrl = `${API_BASE_URL}/${cleanPath}`;
  console.log("Constructed image URL:", fullUrl, "from:", imageURI);
  return fullUrl;
};

export const ProfilePage = () => {
  const { address, isConnected, connect } = useWallet();
  const [selectedGift, setSelectedGift] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [sentGifts, setSentGifts] = useState([]);
  const [receivedGifts, setReceivedGifts] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isConnected && address) {
      const fetchProfileData = async () => {
        setLoading(true);
        setError(null);

        try {
          // Fetch user profile and detailed profile data in parallel
          const [profileData, detailedProfile] = await Promise.all([
            getUserProfile(address),
            getDetailedProfile(address),
          ]);

          console.log("Profile Data:", profileData);
          console.log("Detailed Profile:", detailedProfile);

          setUserProfile({
            username: profileData.data.username,
            stats: {
              totalGiftCardsCreated:
                profileData.data.stats.totalGiftCardsCreated,
              totalGiftCardsSent: profileData.data.stats.totalGiftCardsSent,
              totalGiftCardsReceived:
                profileData.data.stats.totalGiftCardsReceived,
              totalBackgroundsMinted:
                profileData.data.stats.totalBackgroundsMinted,
            },
          });

          // Map received cards
          const mappedReceivedCards = detailedProfile.profile.receivedCards.map(
            (card: GiftCard) => ({
              id: card.id,
              imageUrl: getImageUrl(
                card.Background?.imageURI || card.backgroundUrl
              ),
              senderName:
                card.creatorAddress?.slice(0, 6) +
                "..." +
                card.creatorAddress?.slice(-4),
              recipientName:
                card.currentOwner?.slice(0, 6) +
                "..." +
                card.currentOwner?.slice(-4),
              message: card.message || "",
              amount: `${card.price} USDC`,
              date: (() => {
                const dateStr = card.createdAt;
                return dateStr
                  ? new Date(dateStr).toISOString().split("T")[0]
                  : "";
              })(),
              status: "Received",
            })
          );

          // Map sent cards
          const mappedSentCards = detailedProfile.profile.sentCards.map(
            (card: GiftCard) => ({
              id: card.id,
              imageUrl: getImageUrl(
                card.Background?.imageURI || card.backgroundUrl
              ),
              senderName:
                card.creatorAddress?.slice(0, 6) +
                "..." +
                card.creatorAddress?.slice(-4),
              recipientName:
                card.currentOwner?.slice(0, 6) +
                "..." +
                card.currentOwner?.slice(-4),
              message: card.message || "",
              amount: `${card.price} USDC`,
              date: (() => {
                const dateStr = card.createdAt;
                return dateStr
                  ? new Date(dateStr).toISOString().split("T")[0]
                  : "";
              })(),
              status: "Sent",
            })
          );

          console.log("Mapped Received Cards:", mappedReceivedCards);
          console.log("Mapped Sent Cards:", mappedSentCards);

          setSentGifts(mappedSentCards);
          setReceivedGifts(mappedReceivedCards);
        } catch (error) {
          console.error("Error fetching profile data:", error);
          setError(
            error instanceof Error
              ? error.message
              : "Failed to load profile data"
          );
        } finally {
          setLoading(false);
        }
      };

      fetchProfileData();
    }
  }, [isConnected, address]);

  const handleConnect = async () => {
    try {
      await connect("mock_signature");
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleGiftClick = (gift) => {
    setSelectedGift(gift);
    setDetailsOpen(true);
  };

  if (!isConnected) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="h5" color="text.secondary">
          Please connect your wallet to view your profile
        </Typography>
        <Button variant="contained" onClick={handleConnect}>
          Connect Wallet
        </Button>
      </Box>
    );
  }

  if (!address) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h5" color="text.secondary">
          No wallet address found. Please try reconnecting.
        </Typography>
      </Box>
    );
  }

  const GiftCardItem = ({ gift }: GiftCardItemProps) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative"
    >
      <Card
        onClick={() => handleGiftClick(gift)}
        className="cursor-pointer bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-200 overflow-hidden"
      >
        <CardContent className="p-0">
          <div className="aspect-video relative">
            {gift.imageUrl ? (
              <>
                <img
                  src={gift.imageUrl}
                  alt={`Gift Card`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <GiftIcon className="w-12 h-12 text-white/50" />
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/90">
                    {gift.status === "Sent" ? (
                      <>To: {gift.recipientName}</>
                    ) : (
                      <>From: {gift.senderName}</>
                    )}
                  </p>
                  <p className="text-xs text-white/60">{gift.date}</p>
                  {gift.message && (
                    <p className="text-xs text-white/70 mt-1 italic">
                      "{gift.message}"
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                    {gift.amount}
                  </p>
                  <p className="text-xs text-white/60">{gift.status}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      ) : (
        <>
          {/* Profile Header */}
          <div className="w-full h-48 bg-gradient-to-br from-amber-500/20 to-purple-600/20 rounded-xl relative overflow-hidden mb-8">
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative h-full flex items-center px-8">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
                  <User className="w-12 h-12 text-white/70" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {userProfile?.username || address}
                  </h2>
                  <div className="flex gap-4 text-sm text-white/70">
                    <span>
                      {userProfile?.stats.totalGiftCardsCreated || 0} Created
                    </span>
                    <span>
                      {userProfile?.stats.totalGiftCardsSent || 0} Sent
                    </span>
                    <span>
                      {userProfile?.stats.totalGiftCardsReceived || 0} Received
                    </span>
                    <span>
                      {userProfile?.stats.totalBackgroundsMinted || 0}{" "}
                      Backgrounds
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gift Cards Tabs */}
          <Tabs defaultValue="received" className="w-full">
            <TabsList className="w-full bg-white/5 border-b border-white/10 p-0 h-auto">
              <div className="max-w-7xl mx-auto w-full flex">
                <TabsTrigger
                  value="received"
                  className="flex-1 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white/5"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Received ({receivedGifts.length})
                </TabsTrigger>
                <TabsTrigger
                  value="sent"
                  className="flex-1 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white/5"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Sent ({sentGifts.length})
                </TabsTrigger>
              </div>
            </TabsList>

            <div className="py-8">
              <TabsContent value="received" className="m-0">
                <AnimatePresence>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {receivedGifts.map((gift) => (
                      <GiftCardItem key={gift.id} gift={gift} />
                    ))}
                  </div>
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="sent" className="m-0">
                <AnimatePresence>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sentGifts.map((gift) => (
                      <GiftCardItem key={gift.id} gift={gift} />
                    ))}
                  </div>
                </AnimatePresence>
              </TabsContent>
            </div>
          </Tabs>

          {selectedGift && (
            <GiftCardDetailsDialog
              open={detailsOpen}
              onOpenChange={setDetailsOpen}
              gift={selectedGift}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ProfilePage;
