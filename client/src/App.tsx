import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Upload from "@/pages/upload";
import PaperDetails from "@/pages/paper-details";
import Layout from "@/components/layout/Layout";
import { Web3Provider } from "@/context/Web3Context";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/upload" component={Upload}/>
      <Route path="/papers/:id" component={PaperDetails}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Web3Provider>
        <Layout>
          <Router />
        </Layout>
        <Toaster />
      </Web3Provider>
    </QueryClientProvider>
  );
}

export default App;
