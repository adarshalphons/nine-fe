import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { TryOnProvider } from "@/utils/TryOnContext" // Import the context provider

function App() {
  return (
    <TryOnProvider>
      <Pages />
      <Toaster />
    </TryOnProvider>
  )
}

export default App
