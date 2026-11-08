'use client';

import { useState } from 'react';
import { projectMarketingUrl, readProjectVideoResources } from '@/lib/project-video-resources';

export default function ProjectResources({ content }: { content?: string | null }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  let manifest;
  try { manifest = readProjectVideoResources(content); }
  catch { return <p role="alert">Project videos are unavailable because their published information is invalid.</p>; }
  const stages = { idea: "Planned", running_dev: "In development", beta: "Beta", live: "Live", archived: "Archived" };
  const marketingUrl = projectMarketingUrl(content);
  const main = manifest?.videos.find(video => video.id === manifest.mainVideoId);
  const video = manifest?.videos.find(video => video.id === selectedId) ?? main;
  const ordered = main ? [main, ...manifest!.videos.filter(item => item.id !== main.id)] : [];
  if (!marketingUrl && !manifest) return null;
  return <section className="my-6 space-y-4" aria-label="Project marketing and videos" data-main-video={main?.id}>
    {manifest?.stage && <p className="font-medium">{stages[manifest.stage]}</p>}
    {marketingUrl && <p><a className="text-blue-600 underline" href={marketingUrl} target="_blank" rel="noopener noreferrer">Marketing site</a></p>}
    {video && <>
      <h2 className="text-xl font-semibold">{video.title}</h2>
      <video key={video.id} controls playsInline crossOrigin="anonymous" preload="metadata" src={video.url} poster={video.posterUrl} className="w-full max-h-[500px] bg-black" aria-label="Project marketing video">
        {video.captionsUrl && <track kind="captions" src={video.captionsUrl} srcLang="en" label="English" default />}
        <a href={video.url}>Watch {video.title}</a>
      </video>
      <ul className="space-y-2">{ordered.map(item => <li key={item.id}>
        <a className="text-blue-600 underline" href={item.url} data-project-video={item.id} onClick={event => { event.preventDefault(); setSelectedId(item.id); }}>{item.title}{item.id === main?.id ? ' — Main marketing video' : ''}</a>
      </li>)}</ul>
      {video.musicCredit && <p className="text-sm">{video.musicCredit}</p>}
    </>}
  </section>;
}
