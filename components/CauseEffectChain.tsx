"use client";

import { useState, useEffect } from "react";
import styles from "./CauseEffectChain.module.css";

interface ChainNode {
  title: string;
  detail: string;
  value: string;
}

interface CauseEffectChainProps {
  chain: ChainNode[];
  bottomLine: string;
  context: string;
}

export default function CauseEffectChain({
  chain,
  bottomLine,
  context,
}: CauseEffectChainProps) {
  const [expandedNode, setExpandedNode] = useState<number | null>(null);
  const [visibleNodes, setVisibleNodes] = useState<number>(0);
  const [lineProgress, setLineProgress] = useState(0);

  // Stagger node entrances
  useEffect(() => {
    if (visibleNodes < chain.length) {
      const timer = setTimeout(() => {
        setVisibleNodes((v) => v + 1);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [visibleNodes, chain.length]);

  // Animate connecting line as nodes appear
  useEffect(() => {
    if (visibleNodes > 1) {
      setLineProgress((visibleNodes - 1) / (chain.length - 1));
    }
  }, [visibleNodes, chain.length]);

  // Determine if a node is in the "personal impact" zone (last 2 nodes)
  const isPersonal = (i: number) => i >= chain.length - 2;

  return (
    <div className={styles.wrapper}>
      {/* Section label */}
      <div className={styles.sectionLabel}>
        <span>Cause &amp; Effect Chain</span>
        <div className={styles.labelLine} />
      </div>

      {/* The chain */}
      <div className={styles.chain}>
        {/* Background track line */}
        <div className={styles.trackLine} />

        {/* Animated gradient line */}
        <div
          className={styles.flowLine}
          style={{
            height: `${lineProgress * 100}%`,
            transition: "height 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />

        {chain.map((node, i) => {
          const visible = i < visibleNodes;
          const expanded = expandedNode === i;
          const personal = isPersonal(i);

          return (
            <div key={i}>
              {/* Connector spacing */}
              {i > 0 && (
                <div className={styles.connector}>
                  <div className={styles.connectorDot} />
                </div>
              )}

              {/* Node */}
              <button
                onClick={() =>
                  setExpandedNode(expanded ? null : i)
                }
                className={`${styles.node} ${
                  visible ? styles.nodeVisible : ""
                } ${expanded ? styles.nodeExpanded : ""} ${
                  personal ? styles.nodePersonal : ""
                }`}
                style={{
                  transitionDelay: visible ? "0ms" : `${i * 100}ms`,
                }}
                aria-expanded={expanded}
              >
                {/* Step number */}
                <div
                  className={`${styles.stepDot} ${
                    personal ? styles.stepDotPersonal : ""
                  }`}
                >
                  <span className={styles.stepNumber}>
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* Pulse ring on expanded */}
                  {expanded && (
                    <div
                      className={`${styles.pulseRing} ${
                        personal ? styles.pulseRingPersonal : ""
                      }`}
                    />
                  )}
                </div>

                {/* Card */}
                <div className={styles.card}>
                  {/* Accent bar */}
                  <div
                    className={`${styles.accentBar} ${
                      personal ? styles.accentBarPersonal : ""
                    }`}
                  />

                  {/* Header row */}
                  <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>{node.title}</span>
                    <span
                      className={`${styles.cardValue} ${
                        personal ? styles.cardValuePersonal : ""
                      }`}
                    >
                      {node.value}
                    </span>
                  </div>

                  {/* Expandable detail */}
                  <div
                    className={`${styles.cardDetail} ${
                      expanded ? styles.cardDetailOpen : ""
                    }`}
                  >
                    <p>{node.detail}</p>
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom line */}
      <div
        className={`${styles.bottomLine} ${
          visibleNodes >= chain.length ? styles.bottomLineVisible : ""
        }`}
      >
        <div className={styles.bottomLineLabel}>Your Bottom Line</div>
        <h3 className={styles.bottomLineText}>{bottomLine}</h3>
        <p className={styles.bottomLineContext}>{context}</p>
      </div>

      {/* Tap hint */}
      <div
        className={`${styles.tapHint} ${
          visibleNodes >= chain.length ? styles.tapHintVisible : ""
        }`}
      >
        Tap any node to see the detail
      </div>
    </div>
  );
}