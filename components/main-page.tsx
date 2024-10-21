'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Toast } from "@/components/ui/toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Search, Play, Menu, X, Bell, User, Sun, Moon, Heart, Share2, Download, Eye, MessageSquare, FastForward } from "lucide-react"
import Dexie from 'dexie'

// Define the database
const db = new Dexie('AnimeDatabase')
db.version(1).stores({
  continueWatching: '++id, anime, episode, progress, lastWatched',
  comments: '++id, anime, user, text, timestamp',
  viewCounts: 'anime, count'
})

export function MainPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [notifications, setNotifications] = useState([])
  const [viewCount, setViewCount] = useState({})
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [continueWatching, setContinueWatching] = useState([])
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setToastMessage(`Searching for: ${searchQuery}`)
    setShowToast(true)
  }

  const handleAddToFavorites = (anime) => {
    setToastMessage(`Added ${anime} to favorites!`)
    setShowToast(true)
  }

  const handleShare = (anime) => {
    setToastMessage(`Shared ${anime} with friends!`)
    setShowToast(true)
  }

  const handleContinueWatching = async (anime) => {
    const existingEntry = await db.continueWatching.where('anime').equals(anime).first()
    if (existingEntry) {
      await db.continueWatching.update(existingEntry.id, {
        episode: existingEntry.episode + 1,
        progress: 0,
        lastWatched: new Date()
      })
    } else {
      await db.continueWatching.add({
        anime,
        episode: 1,
        progress: 0,
        lastWatched: new Date()
      })
    }
    loadContinueWatching()
    setToastMessage(`Continuing ${anime}`)
    setShowToast(true)
  }

  const handleAddComment = async () => {
    if (newComment.trim()) {
      await db.comments.add({
        anime: 'General',
        user: 'Anonymous',
        text: newComment,
        timestamp: new Date()
      })
      setNewComment("")
      loadComments()
    }
  }

  const loadContinueWatching = async () => {
    const entries = await db.continueWatching.orderBy('lastWatched').reverse().toArray()
    setContinueWatching(entries)
  }

  const loadComments = async () => {
    const latestComments = await db.comments.orderBy('timestamp').reverse().limit(5).toArray()
    setComments(latestComments)
  }

  const loadViewCounts = async () => {
    const counts = await db.viewCounts.toArray()
    const countsObject = counts.reduce((acc, curr) => {
      acc[curr.anime] = curr.count
      return acc
    }, {})
    setViewCount(countsObject)
  }

  const updateViewCount = async (anime) => {
    const currentCount = await db.viewCounts.get(anime) || { count: 0 }
    await db.viewCounts.put({ anime, count: currentCount.count + 1 })
    loadViewCounts()
  }

  useEffect(() => {
    loadContinueWatching()
    loadComments()
    loadViewCounts()

    // Simulate real-time notifications
    const notificationInterval = setInterval(() => {
      const newNotification = `New episode of ${['One Piece', 'My Hero Academia', 'Demon Slayer'][Math.floor(Math.random() * 3)]} is now available!`
      setNotifications(prev => [newNotification, ...prev.slice(0, 4)])
    }, 30000)

    // Simulate real-time view count updates
    const viewCountInterval = setInterval(() => {
      const randomAnime = ['One Piece', 'My Hero Academia', 'Demon Slayer', 'Jujutsu Kaisen', 'Spy x Family'][Math.floor(Math.random() * 5)]
      updateViewCount(randomAnime)
    }, 5000)

    return () => {
      clearInterval(notificationInterval)
      clearInterval(viewCountInterval)
    }
  }, [])

  const animeList = ['One Piece', 'My Hero Academia', 'Demon Slayer', 'Jujutsu Kaisen', 'Spy x Family']

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
        <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">AnimeHub</h1>
              <div className="hidden md:flex items-center space-x-4">
                <form onSubmit={handleSearch} className="flex">
                  <Input 
                    className="w-64" 
                    placeholder="Search anime..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button type="submit" variant="outline" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Bell className="h-5 w-5" />
                        {notifications.length > 0 && (
                          <Badge className="absolute -top-1 -right-1 px-1 py-0.5 text-xs">
                            {notifications.length}
                          </Badge>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="w-64">
                        <h3 className="font-semibold mb-2">Notifications</h3>
                        {notifications.map((notification, index) => (
                          <p key={index} className="text-sm mb-1">{notification}</p>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Avatar>
                  <AvatarImage src="/placeholder.svg" alt="User" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
                {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </div>
              <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMenu}>
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </header>

        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800 p-4">
            <form onSubmit={handleSearch} className="mb-4">
              <Input 
                className="w-full mb-2" 
                placeholder="Search anime..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" className="w-full">Search</Button>
            </form>
            <div className="flex justify-between items-center">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 px-1 py-0.5 text-xs">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
              <Avatar>
                <AvatarImage src="/placeholder.svg" alt="User" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex items-center space-x-2">
                <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
                {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </div>
            </div>
          </div>
        )}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Featured Anime</h2>
            <Card className="overflow-hidden">
              <div className="relative h-[300px] md:h-[400px]">
                <img
                  src="/placeholder.svg?height=400&width=800"
                  alt="Featured Anime"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Attack on Titan: Final Season</h3>
                  <p className="text-gray-300 mb-4 hidden md:block">The epic conclusion to the battle for humanity's survival!</p>
                  <div className="flex space-x-2">
                    <Button onClick={() => handleContinueWatching("Attack on Titan: Final Season")}>
                      <Play className="mr-2 h-4 w-4" /> Watch Now
                    </Button>
                    <Button variant="outline" onClick={() => handleAddToFavorites("Attack on Titan: Final Season")}>
                      <Heart className="mr-2 h-4 w-4" /> Add to Favorites
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <Tabs defaultValue="popular" className="mb-12">
            <TabsList className="mb-4">
              <TabsTrigger value="popular">Popular</TabsTrigger>
              <TabsTrigger value="new">New Releases</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            </TabsList>
            <TabsContent value="popular">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                {animeList.map((anime, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-0 relative">
                      <img
                        src={`/placeholder.svg?height=250&width=200&text=${anime}`}
                        alt={anime}
                        className="w-full h-[200px] object-cover"
                      />
                      <Badge className="absolute top-2 right-2">HD</Badge>
                    </CardContent>
                    <CardFooter className="flex flex-col items-start p-2">
                      <CardTitle className="text-sm mb-1">{anime}</CardTitle>
                      <CardDescription className="text-xs mb-2">English Dub</CardDescription>
                      <div className="flex justify-between w-full">
                        <Button size="sm" onClick={() => handleContinueWatching(anime)}>
                          <Play className="mr-2 h-3 w-3" /> Watch
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleShare(anime)}>
                          <Share2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <Eye className="h-3 w-3 mr-1" />
                        {viewCount[anime] || 0} watching now
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="new">
              <div className="text-center text-gray-500 dark:text-gray-400">New releases coming soon!</div>
            </TabsContent>
            <TabsContent value="upcoming">
              <div className="text-center text-gray-500 dark:text-gray-400">Stay tuned for upcoming anime!</div>
            </TabsContent>
          </Tabs>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Continue Watching</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {continueWatching.map((item, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-0 relative">
                    <img
                      src={`/placeholder.svg?height=200&width=300&text=${item.anime}`}
                      
                      alt={item.anime}
                      className="w-full h-[150px] object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                      <div className="h-full bg-primary" style={{width: `${item.progress}%`}}></div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center p-2">
                    <div>
                      <CardTitle className="text-sm">{item.anime}</CardTitle>
                      <CardDescription className="text-xs">Episode {item.episode}</CardDescription>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => handleContinueWatching(item.anime)}>
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => {
                        db.continueWatching.update(item.id, { progress: Math.min(item.progress + 10, 100) })
                        loadContinueWatching()
                      }}>
                        <FastForward className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Community Discussion</h2>
            <Card>
              <CardHeader>
                <CardTitle>Latest Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {comments.map((comment, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Avatar>
                        <AvatarFallback>{comment.user[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{comment.user}</p>
                        <p className="text-sm text-gray-500">{comment.text}</p>
                        <p className="text-xs text-gray-400">{new Date(comment.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <div className="w-full flex space-x-2">
                  <Input 
                    placeholder="Add a comment..." 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <Button onClick={handleAddComment}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Comment
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </section>
        </main>

        {showToast && (
          <Toast className="fixed bottom-4 right-4 bg-primary text-white p-4 rounded-md shadow-lg">
            {toastMessage}
          </Toast>
        )}
      </div>
    </div>
  )
}