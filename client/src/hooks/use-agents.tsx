import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AgentProfile, AgentCertification, AgentReview, User } from "@shared/schema";

// Extended agent type with user info
export interface AgentWithUserInfo extends AgentProfile {
  user: User;
  certifications?: AgentCertification[];
  reviews?: AgentReview[];
}

export function useAgents(params?: {
  state?: string;
  propertyType?: string;
  expertise?: string[];
  certifications?: string[];
  minRating?: number;
  minTransactions?: number;
  boundaryFilter?: any; // GeoJSON polygon for filtering by area
}) {
  // Build query string based on filters
  let queryString = "/api/agents";
  const queryParams: string[] = [];
  
  if (params?.state) {
    queryParams.push(`state=${encodeURIComponent(params.state)}`);
  }
  
  if (params?.propertyType) {
    queryParams.push(`propertyType=${encodeURIComponent(params.propertyType)}`);
  }
  
  if (params?.expertise && params.expertise.length > 0) {
    params.expertise.forEach(exp => {
      queryParams.push(`expertise=${encodeURIComponent(exp)}`);
    });
  }
  
  if (params?.certifications && params.certifications.length > 0) {
    params.certifications.forEach(cert => {
      queryParams.push(`certification=${encodeURIComponent(cert)}`);
    });
  }
  
  if (params?.minRating) {
    queryParams.push(`minRating=${params.minRating}`);
  }
  
  if (params?.minTransactions) {
    queryParams.push(`minTransactions=${params.minTransactions}`);
  }
  
  // Add boundary filter if provided
  if (params?.boundaryFilter) {
    queryParams.push(`boundaryFilter=${encodeURIComponent(JSON.stringify(params.boundaryFilter))}`);
  }
  
  if (queryParams.length > 0) {
    queryString += `?${queryParams.join("&")}`;
  }
  
  return useQuery<AgentWithUserInfo[], Error>({
    queryKey: ['/api/agents', params],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAgent(agentId: number) {
  return useQuery<AgentWithUserInfo, Error>({
    queryKey: ['/api/agents', agentId],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAgentReviews(agentId: number) {
  return useQuery<AgentReview[], Error>({
    queryKey: ['/api/agents', agentId, 'reviews'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAgentCertifications(agentId: number) {
  return useQuery<AgentCertification[], Error>({
    queryKey: ['/api/agents', agentId, 'certifications'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAgentTransactions(agentId: number) {
  return useQuery<any[], Error>({
    queryKey: ['/api/agents', agentId, 'transactions'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAgentProperties(agentId: number) {
  return useQuery<any[], Error>({
    queryKey: ['/api/agents', agentId, 'properties'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAgentQuestions(agentId?: number) {
  return useQuery<any[], Error>({
    queryKey: agentId ? ['/api/agents', agentId, 'questions'] : ['/api/agent-questions'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}