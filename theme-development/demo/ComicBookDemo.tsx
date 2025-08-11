'use client';

import React from 'react';
import ComicPanel from '../components/comic/ComicPanel';
import SpeechBubble from '../components/comic/SpeechBubble';

const ComicBookDemo: React.FC = () => {
  return (
    <div className="demo-page theme-comic">
      <div className="container">
        <div className="demo-header">
          <h1 className="demo-title">SUPERMAN COMIC BOOK THEME</h1>
          <p className="demo-description">
            Experience the Golden Age of comic books with bold colors, dynamic panels, and classic superhero aesthetics!
          </p>
        </div>

        <div className="demo-content">
          {/* Hero Section */}
          <ComicPanel panelType="full-width" animation="page-turn" delay={0}>
            <h2>THE ADVENTURES OF SUPERMAN</h2>
            <p>
              Faster than a speeding bullet! More powerful than a locomotive! 
              Able to leap tall buildings in a single bound! Look! Up in the sky! 
              It's a bird! It's a plane! It's Superman!
            </p>
            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
              <SpeechBubble 
                text="I'm here to help, citizens!" 
                character="Superman" 
                emotion="happy" 
                position="top"
              />
              <SpeechBubble 
                text="Oh no! What will we do?" 
                character="Citizen" 
                emotion="surprised" 
                position="bottom"
              />
            </div>
          </ComicPanel>

          {/* Main Content Grid */}
          <div className="comic-grid">
            <ComicPanel panelType="main" animation="slide-in" delay={200}>
              <h3>POWERS & ABILITIES</h3>
              <ul>
                <li>Superhuman Strength</li>
                <li>Flight</li>
                <li>Heat Vision</li>
                <li>X-Ray Vision</li>
                <li>Super Speed</li>
                <li>Invulnerability</li>
              </ul>
              <SpeechBubble 
                text="My powers come from Earth's yellow sun!" 
                type="thought" 
                position="right"
              />
            </ComicPanel>

            <ComicPanel panelType="sidebar" animation="zoom-in" delay={400}>
              <h3>SECRET IDENTITY</h3>
              <p>
                By day, mild-mannered reporter Clark Kent works at the Daily Planet 
                alongside Lois Lane and Jimmy Olsen.
              </p>
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  background: 'var(--color-primary)', 
                  borderRadius: '50%',
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  S
                </div>
              </div>
            </ComicPanel>

            <ComicPanel panelType="main" animation="fade-in" delay={600}>
              <h3>ARCH-ENEMY: LEX LUTHOR</h3>
              <p>
                The brilliant but evil Lex Luthor constantly schemes to destroy Superman 
                and take over the world with his advanced technology.
              </p>
              <SpeechBubble 
                text="I'll destroy you, Superman! This time for sure!" 
                character="Lex Luthor" 
                emotion="angry" 
                position="top"
              />
            </ComicPanel>

            <ComicPanel panelType="sidebar" animation="slide-in" delay={800}>
              <h3>FORTRESS OF SOLITUDE</h3>
              <p>
                Located in the Arctic, this crystal palace contains advanced Kryptonian 
                technology and serves as Superman's headquarters.
              </p>
            </ComicPanel>
          </div>

          {/* Action Scene */}
          <ComicPanel panelType="full-width" animation="page-turn" delay={1000}>
            <h2>EPIC BATTLE SCENE</h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '20px',
              marginTop: '20px'
            }}>
              <div>
                <h3>HERO</h3>
                <p>Superman stands ready to defend Metropolis!</p>
                <SpeechBubble 
                  text="Justice will prevail!" 
                  character="Superman" 
                  emotion="happy" 
                  position="top"
                />
              </div>
              <div>
                <h3>VILLAIN</h3>
                <p>Dark forces gather to challenge our hero!</p>
                <SpeechBubble 
                  text="Your time is up, Superman!" 
                  character="Villain" 
                  emotion="angry" 
                  position="bottom"
                />
              </div>
            </div>
          </ComicPanel>

          {/* Sound Effects Demo */}
          <ComicPanel panelType="full-width" animation="fade-in" delay={1200}>
            <h2>COMIC BOOK SOUND EFFECTS</h2>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-around', 
              flexWrap: 'wrap',
              gap: '20px',
              marginTop: '20px'
            }}>
              <div className="sound-effect" style={{ animationDelay: '0s' }}>POW!</div>
              <div className="sound-effect" style={{ animationDelay: '0.5s' }}>BAM!</div>
              <div className="sound-effect" style={{ animationDelay: '1s' }}>ZAP!</div>
              <div className="sound-effect" style={{ animationDelay: '1.5s' }}>BOOM!</div>
              <div className="sound-effect" style={{ animationDelay: '2s' }}>WHAM!</div>
            </div>
          </ComicPanel>

          {/* Navigation Demo */}
          <div className="comic-navigation">
            <div className="comic-issue-info">
              <span className="issue-number">Issue #1</span>
              <span className="page-number">Page 1</span>
            </div>
            <div className="comic-menu">
              <button className="comic-btn comic-btn-primary">HOME</button>
              <button className="comic-btn comic-btn-secondary">BLOG</button>
              <button className="comic-btn comic-btn-accent">PROJECTS</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComicBookDemo;
