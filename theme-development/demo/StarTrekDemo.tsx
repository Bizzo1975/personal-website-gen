'use client';

import React from 'react';
import LCARSPanel from '../components/startrek/LCARSPanel';
import HolographicDisplay from '../components/startrek/HolographicDisplay';

const StarTrekDemo: React.FC = () => {
  return (
    <div className="demo-page theme-startrek">
      <div className="container">
        <div className="demo-header">
          <h1 className="demo-title">STAR TREK LCARS INTERFACE</h1>
          <p className="demo-description">
            Welcome to the 24th century! Experience the Library Computer Access/Retrieval System (LCARS) interface.
          </p>
        </div>

        <div className="demo-content">
          {/* Main Bridge Display */}
          <LCARSPanel panelType="main" color="orange" size="large" interactive={true}>
            <h2>USS ENTERPRISE NCC-1701-D</h2>
            <p>
              Welcome to the bridge of the Federation Starship Enterprise. 
              All systems are operating at optimal efficiency.
            </p>
            <div className="computer-voice">
              All systems operational. Warp drive ready. Shields at maximum.
            </div>
          </LCARSPanel>

          {/* LCARS Grid Layout */}
          <div className="lcars-grid">
            <LCARSPanel panelType="status" color="green" size="medium">
              <h3>SYSTEM STATUS</h3>
              <div className="status-display">
                WARP CORE: OPTIMAL
              </div>
              <div className="status-display">
                SHIELDS: 100%
              </div>
              <div className="status-display">
                PHASERS: READY
              </div>
              <div className="status-display">
                TRANSPORTER: ONLINE
              </div>
            </LCARSPanel>

            <LCARSPanel panelType="sidebar" color="blue" size="medium">
              <h3>CREW ROSTER</h3>
              <ul>
                <li>Captain Jean-Luc Picard</li>
                <li>Commander William Riker</li>
                <li>Lt. Commander Data</li>
                <li>Lt. Commander Geordi La Forge</li>
                <li>Counselor Deanna Troi</li>
                <li>Lt. Worf</li>
                <li>Dr. Beverly Crusher</li>
              </ul>
            </LCARSPanel>

            <LCARSPanel panelType="alert" color="red" size="medium">
              <h3>ALERT STATUS</h3>
              <div className="alert-display">
                RED ALERT: KLINGON VESSEL DETECTED
              </div>
              <p>
                Unidentified Klingon vessel approaching at high warp. 
                Recommend raising shields and going to red alert.
              </p>
            </LCARSPanel>

            <LCARSPanel panelType="sidebar" color="gray" size="medium">
              <h3>MISSION LOG</h3>
              <p>
                Stardate 41153.7: The Enterprise continues its mission 
                of exploration and diplomacy in the Alpha Quadrant.
              </p>
              <div className="computer-voice">
                Mission log entry complete.
              </div>
            </LCARSPanel>
          </div>

          {/* Holographic Displays */}
          <HolographicDisplay type="projection" intensity={1} flicker={true} autoRotate={true}>
            <h3>HOLOGRAPHIC PROJECTION</h3>
            <p>
              This is a demonstration of the Enterprise's holographic display system. 
              The technology allows for three-dimensional visualization of complex data.
            </p>
            <div style={{ 
              width: '100px', 
              height: '100px', 
              background: 'var(--color-primary)', 
              margin: '20px auto',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-background)',
              fontWeight: 'bold'
            }}>
              LCARS
            </div>
          </HolographicDisplay>

          <HolographicDisplay type="status" intensity={2} flicker={false}>
            <h3>SYSTEM DIAGNOSTICS</h3>
            <div className="status-display">
              WARP CORE TEMPERATURE: 1,200 KELVIN
            </div>
            <div className="status-display">
              PLASMA FLOW: NOMINAL
            </div>
            <div className="status-display">
              DILITHIUM CRYSTALS: STABLE
            </div>
            <div className="status-display">
              ANTIMATTER CONTAINMENT: SECURE
            </div>
          </HolographicDisplay>

          {/* Navigation Interface */}
          <div className="lcars-navigation">
            <div className="lcars-system-info">
              <span className="system-name">ENTERPRISE</span>
              <span className="stardate">STARDATE 41153.7</span>
            </div>
            <div className="lcars-menu">
              <button className="lcars-btn lcars-btn-primary">MAIN</button>
              <button className="lcars-btn lcars-btn-secondary">SCIENCE</button>
              <button className="lcars-btn lcars-btn-accent">ENGINEERING</button>
              <button className="lcars-btn">SECURITY</button>
            </div>
          </div>

          {/* Engineering Section */}
          <LCARSPanel panelType="main" color="orange" size="large">
            <h2>ENGINEERING SECTION</h2>
            <p>
              The Enterprise's warp core is the heart of the ship, providing 
              the energy needed for faster-than-light travel.
            </p>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '20px',
              marginTop: '20px'
            }}>
              <div>
                <h3>WARP CORE</h3>
                <div className="status-display">
                  MATTER/ANTIMATTER REACTION: STABLE
                </div>
                <div className="status-display">
                  WARP FIELD INTEGRITY: 100%
                </div>
              </div>
              <div>
                <h3>IMPULSE ENGINES</h3>
                <div className="status-display">
                  IMPULSE POWER: 75%
                </div>
                <div className="status-display">
                  MANEUVERING THRUSTERS: ONLINE
                </div>
              </div>
            </div>
          </LCARSPanel>

          {/* Science Lab */}
          <LCARSPanel panelType="sidebar" color="blue" size="medium">
            <h3>SCIENCE LAB</h3>
            <p>
              The Enterprise's science labs are equipped with the latest 
              Federation technology for research and analysis.
            </p>
            <div className="computer-voice">
              Sensor analysis complete. Anomaly detected in sector 7.
            </div>
          </LCARSPanel>

          {/* Security Alert */}
          <LCARSPanel panelType="alert" color="red" size="medium">
            <h3>SECURITY ALERT</h3>
            <div className="alert-display">
              INTRUDER ALERT: UNAUTHORIZED ACCESS DETECTED
            </div>
            <p>
              Security teams have been dispatched to Deck 12. 
              All personnel should remain at their stations.
            </p>
          </LCARSPanel>
        </div>
      </div>
    </div>
  );
};

export default StarTrekDemo;
