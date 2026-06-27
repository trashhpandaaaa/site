"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import SiteNav from "./components/SiteNav";
import TrendingCards from "./components/TrendingCards";
import BattleSplit from "./components/BattleSplit";
import DiscussionsGrid from "./components/DiscussionsGrid";
import ReelsRail from "./components/ReelsRail";
import ShareRow from "./components/ShareRow";
import useScrollReveal from "./components/useScrollReveal";
import {
  IconBook,
  IconBriefcase,
  IconCheck,
  IconChat,
  IconHome
} from "./components/icons";

// Maps the modal's verdict keys onto the canonical labels the reviews/Experience
// feed groups and colours by.
const VERDICT_LABELS = {
  ramro: "Ramro chha",
  thikai: "Thikai chha",
  naramro: "Naramro chha"
};

function FeaturedIcon({ type }) {
  if (type === "home") return <IconHome className="icon" />;
  if (type === "briefcase") return <IconBriefcase className="icon" />;
  return <IconBook className="icon" />;
}

export default function HomeClient({
  trending = [],
  featured = [],
  battles = [],
  reviews = [],
  stats = [],
  reels = []
}) {
  const verdictRef = useRef(null);
  const activeTabRef = useRef("share");
  const router = useRouter();

  useScrollReveal();

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key !== "Escape") return;
      const bg = document.getElementById("modal-bg");
      if (!bg) return;
      bg.classList.remove("open");
      document.body.style.overflow = "";
    };

    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const submitSearch = () => {
    const input = document.getElementById("srch");
    const value = input ? input.value.trim() : "";
    if (!value) return;
    router.push(`/chat?q=${encodeURIComponent(value)}`);
  };

  const handleSearchKey = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    submitSearch();
  };

  const fillSearch = (text, el) => {
    const input = document.getElementById("srch");
    if (input) {
      input.value = text;
      input.focus();
    }
    document.querySelectorAll(".chip").forEach((chip) => chip.classList.remove("active"));
    if (el) {
      el.classList.add("active");
    }
  };

  const openModal = (tab) => {
    const bg = document.getElementById("modal-bg");
    if (!bg) return;
    bg.classList.add("open");
    document.body.style.overflow = "hidden";
    switchMTab(tab);
  };

  const closeModal = () => {
    const bg = document.getElementById("modal-bg");
    if (!bg) return;
    bg.classList.remove("open");
    document.body.style.overflow = "";
  };

  const closeBg = (event) => {
    if (event.target.id === "modal-bg") {
      closeModal();
    }
  };

  const switchMTab = (tab) => {
    activeTabRef.current = tab;
    ["share", "ask"].forEach((key) => {
      const tabBtn = document.getElementById(`tab-${key}`);
      const panel = document.getElementById(`mp-${key}`);
      if (tabBtn) tabBtn.classList.toggle("on", key === tab);
      if (panel) panel.classList.toggle("on", key === tab);
      const success = document.getElementById(`suc-${key}`);
      if (success) success.style.display = "none";
      if (panel) panel.style.display = "";
    });
    const tabs = document.querySelector(".modal-tabs");
    if (tabs) tabs.style.opacity = "1";
  };

  const pickV = (verdict) => {
    verdictRef.current = verdict;
    ["vr", "vt", "vn"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.remove("on");
    });
    const map = { ramro: "vr", thikai: "vt", naramro: "vn" };
    const target = document.getElementById(map[verdict]);
    if (target) target.classList.add("on");
    calcProg();
  };

  const toggleT = (el) => {
    if (!el) return;
    el.classList.toggle("on");
    calcProg();
  };

  const calcProg = () => {
    const topic = document.getElementById("sh-topic");
    const exp = document.getElementById("sh-exp");
    const tags = document.querySelectorAll(".tpill.on").length;
    const steps = [
      topic && topic.value.trim().length > 0,
      verdictRef.current !== null,
      tags > 0,
      exp && exp.value.trim().length > 10,
      false
    ];

    ["sp1", "sp2", "sp3", "sp4", "sp5"].forEach((id, index) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle("fill", steps[index]);
    });
  };

  const fillAsk = (text) => {
    const input = document.getElementById("ask-q");
    if (input) {
      input.value = text;
      input.focus();
    }
  };

  const submitForm = async (type) => {
    const panel = document.getElementById(`mp-${type}`);
    const success = document.getElementById(`suc-${type}`);
    const tabs = document.querySelector(".modal-tabs");

    if (type === "share") {
      const title = document.getElementById("sh-topic")?.value.trim() || "";
      const summary = document.getElementById("sh-exp")?.value.trim() || "";
      const verdictKey = verdictRef.current || "";
      const categories = Array.from(document.querySelectorAll(".tpill.on")).map((el) =>
        el.textContent.trim()
      );

      if (!title || !summary || !verdictKey) {
        window.alert("Please fill topic, verdict, and experience before submitting.");
        return;
      }

      // Post into the same reviews pool the homepage discussions and Experience
      // page read from, so a shared story shows up alongside everyone else's.
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          category: categories[0] || "General",
          verdict: VERDICT_LABELS[verdictKey] || "",
          summary
        })
      });

      if (response.status === 401) {
        window.location.href = "/sign-in";
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        window.alert(data?.error || "Failed to share experience. Please try again.");
        return;
      }
    }

    if (type === "ask") {
      const question = document.getElementById("ask-q")?.value.trim() || "";
      const category = document.getElementById("ask-cat")?.value.trim() || "";

      if (!question) {
        window.alert("Please enter a question before submitting.");
        return;
      }

      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ question, category })
      });

      if (response.status === 401) {
        window.location.href = "/sign-in";
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        window.alert(data?.error || "Failed to post question. Please try again.");
        return;
      }
    }

    if (panel) panel.style.display = "none";
    if (success) success.style.display = "flex";
    if (tabs) tabs.style.opacity = "0";
  };

  const resetModal = () => {
    verdictRef.current = null;
    document.querySelectorAll(".vbtn-m").forEach((btn) => btn.classList.remove("on"));
    document.querySelectorAll(".tpill").forEach((pill) => pill.classList.remove("on"));
    document.querySelectorAll(".pseg").forEach((seg) => seg.classList.remove("fill"));
    ["sh-topic", "sh-exp", "ask-q"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    const shareSuccess = document.getElementById("suc-share");
    if (shareSuccess) shareSuccess.style.display = "none";
    const askSuccess = document.getElementById("suc-ask");
    if (askSuccess) askSuccess.style.display = "none";
    const sharePanel = document.getElementById("mp-share");
    if (sharePanel) sharePanel.style.display = "";
    const askPanel = document.getElementById("mp-ask");
    if (askPanel) askPanel.style.display = "";
    const tabs = document.querySelector(".modal-tabs");
    if (tabs) tabs.style.opacity = "1";
    switchMTab(activeTabRef.current);
  };

  const uniqueTitles = Array.from(
    new Set(trending.map((topic) => topic.title).filter((title) => Boolean(title)))
  );
  const chipItems = uniqueTitles.slice(0, 6);
  const searchItems = uniqueTitles.slice(0, 5);
  const suggestedQuestions = uniqueTitles.slice(0, 4);

  const marqueeItems = trending
    .slice(0, 6)
    .map((topic) => {
      if (!topic?.title) return null;
      const totalVotes = (topic.votes_yes || 0) + (topic.votes_mid || 0) + (topic.votes_no || 0);
      const activity = totalVotes
        ? `${totalVotes.toLocaleString("en-US")} votes`
        : `${(topic.likes || 0).toLocaleString("en-US")} likes`;
      return `${topic.title} - ${activity}`;
    })
    .filter((label) => Boolean(label));
  const marqueeLoop = marqueeItems.length ? [...marqueeItems, ...marqueeItems] : [];

  const featuredMain = featured.find((item) => item.slot === "main");
  const featuredSide = featured.filter((item) => item.slot !== "main").slice(0, 2);

  return (
    <>
      <SiteNav onAsk={() => openModal("ask")} onShare={() => openModal("share")} />

      {marqueeLoop.length > 0 ? (
        <div className="marquee">
          <div className="m-track">
            {marqueeLoop.map((label, index) => (
              <span className="m-item" key={`${label}-${index}`}>{label}</span>
            ))}
          </div>
        </div>
      ) : null}

      <section className="hero" id="hero">
        <div className="hero-glow"></div>
        <div className="kicker">
          <span className="kicker-dot"></span>
          Nepal ko real talk, seedha kura
        </div>
        <h1>
          Nepal ma sabai kura...
          <br />
          <em>KastoChha?</em>
        </h1>
        <p className="hero-sub">
          Real opinions from real people. Price, service, and long term use - no paid hype.
        </p>

        <div className="search-wrap">
          <div className="search-inner">
            <input
              id="srch"
              type="text"
              placeholder="Search anything... (e.g. phone review)"
              autoComplete="off"
              onKeyDown={handleSearchKey}
            />
            <button type="button" className="s-btn" onClick={submitSearch}>Go</button>
          </div>
        </div>

        {chipItems.length > 0 ? (
          <div className="chips-row">
            {chipItems.map((label) => (
              <button
                key={label}
                type="button"
                className="chip"
                onClick={(e) => fillSearch(label, e.currentTarget)}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        {searchItems.length > 0 ? (
          <div className="t-searches">
            <p>Trending searches</p>
            <ul>
              {searchItems.map((label) => (
                <li key={label}>
                  <a href={`/chat?q=${encodeURIComponent(label)}`}>{label}</a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="section" id="trending">
        <div className="container">
          <div className="sec-head">
            <div className="sec-head-left">
              <div className="sec-eyebrow">
                <span className="sec-tag">LIVE</span>
                <div className="sec-rule"></div>
              </div>
              <h2 className="sec-title">Trending <em>KastoChha</em></h2>
              <p className="sec-sub">Questions, Debates, and Decisions - What Nepal is talking about right now.</p>
            </div>
            <a href="/trending" className="sec-all">View all -&gt;</a>
          </div>

          <TrendingCards topics={trending} />
        </div>
      </section>

      <section className="section section-alt" id="battle">
        <div className="container">
          <div className="sec-head">
            <div className="sec-head-left">
              <div className="sec-eyebrow">
                <span className="sec-tag">VOTE NOW</span>
                <div className="sec-rule"></div>
              </div>
              <h2 className="sec-title">KastoChha <em>Battle</em></h2>
              <p className="sec-sub">Vote and Decide - Make your decision from experiences.</p>
            </div>
            <a href="/battle" className="sec-all">All battles -&gt;</a>
          </div>

          <BattleSplit battles={battles} />
        </div>
      </section>

      <section className="section section-deep" id="discussions">
        <div className="container">
          <div className="sec-head">
            <div className="sec-head-left">
              <div className="sec-eyebrow">
                <span className="sec-tag">COMMUNITY</span>
                <div className="sec-rule"></div>
              </div>
              <h2 className="sec-title">KastoChha <em>Discussions</em></h2>
              <p className="sec-sub">Reviews and Opinions from people across Nepal.</p>
            </div>
            <a href="/experience" className="sec-all">All discussions -&gt;</a>
          </div>

          <DiscussionsGrid reviews={reviews} limit={6} />

          <div className="join-band">
            <div className="join-card ask" onClick={() => openModal("ask")}>
              <span className="join-tag">Community Q and A</span>
              <div className="join-heading">Ask the community</div>
              <div className="join-desc">Kuch jannu chha? Sidha sodhnus. People share what actually happened.</div>
              <span className="join-go">Ask now -&gt;</span>
            </div>
            <div className="join-card share" onClick={() => openModal("share")}>
              <span className="join-tag">Real Experiences</span>
              <div className="join-heading">Share your experience</div>
              <div className="join-desc">Tapai ko experience share gare aru lai maddat huncha. Cost ra timeline mention gare ramro.</div>
              <span className="join-go">Share now -&gt;</span>
            </div>
          </div>

          {stats.length > 0 ? (
            <div className="stat-strip">
              {stats.map((stat) => (
                <div className="stat-box" key={stat.id}>
                  <span className="stat-val">{stat.value}</span>
                  <div className="stat-lbl">{stat.label}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="section" id="reels">
        <div className="container">
          <div className="sec-head">
            <div className="sec-head-left">
              <div className="sec-eyebrow">
                <span className="sec-tag">WATCH</span>
                <div className="sec-rule"></div>
              </div>
              <h2 className="sec-title">KastoChha <em>Reels</em></h2>
              <p className="sec-sub">Explore our reels across different niche channels and stay updated.</p>
            </div>
            <a href="https://www.youtube.com/results?search_query=kastochha" target="_blank" rel="noopener noreferrer" className="sec-all">Follow us -&gt;</a>
          </div>

          <ReelsRail reels={reels} />
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="section section-alt" id="featured">
          <div className="container">
            <div className="sec-head">
              <div className="sec-head-left">
                <div className="sec-eyebrow">
                  <span className="sec-tag">EDITOR PICK</span>
                  <div className="sec-rule"></div>
                </div>
                <h2 className="sec-title">Featured <em>KastoChha</em></h2>
                <p className="sec-sub">Curated stories with long threads and real receipts</p>
              </div>
            </div>

            <div className="feat-grid bento-grid fi">
              {featuredMain ? (
                <div className="fc fc-main bento-card">
                  <div className="fc-visual">
                    <div className="fc-star">Editor pick</div>
                    <div className="fc-emoji"><FeaturedIcon type={featuredMain.icon} /></div>
                  </div>
                  <div className="fc-body">
                    <span className="fc-why">{featuredMain.why_text}</span>
                    <div className="fc-title">{featuredMain.title}</div>
                    <div className="fc-desc">{featuredMain.description}</div>
                    {featuredMain.link_url ? (
                      <a href={featuredMain.link_url} className="fc-read">Read full story -&gt;</a>
                    ) : null}
                    <ShareRow text={featuredMain.title} url={`/featured/${featuredMain.id}`} label="Share" />
                  </div>
                </div>
              ) : null}

              {featuredSide.map((story, index) => (
                <div
                  className={`fc ${index === 0 ? "fc-b" : "fc-c"} bento-card`}
                  key={story.id}
                >
                  <div className="fc-visual">
                    <div className="fc-emoji"><FeaturedIcon type={story.icon} /></div>
                  </div>
                  <div className="fc-body">
                    <span className="fc-why">{story.why_text}</span>
                    <div className="fc-title">{story.title}</div>
                    <div className="fc-desc">{story.description}</div>
                    {story.link_url ? (
                      <a href={story.link_url} className="fc-read">Read -&gt;</a>
                    ) : null}
                    <ShareRow text={story.title} url={`/featured/${story.id}`} label="Share" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <footer>
        <div className="foot-inner">
          <div className="foot-grid">
            <div>
              <a href="#" className="foot-logo">Kasto<em>Chha</em></a>
              <p className="foot-tagline">Nepal ko real talk platform. Real opinions, no drama. Built for Nepalis, by Nepalis.</p>
            </div>
            <div className="foot-col">
              <h5>Explore</h5>
              <ul>
                <li><a href="/trending">Trending</a></li>
                <li><a href="/battle">Battle</a></li>
                <li><a href="/experience">Discussions</a></li>
                <li><a href="/featured">Featured</a></li>
              </ul>
            </div>
            <div className="foot-col">
              <h5>Topics</h5>
              <ul>
                <li><a href="#">Technology</a></li>
                <li><a href="#">Career</a></li>
                <li><a href="#">Education</a></li>
                <li><a href="#">Housing</a></li>
                <li><a href="#">Finance</a></li>
              </ul>
            </div>
            <div className="foot-col">
              <h5>About</h5>
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="foot-mark" aria-hidden="true">KastoChha</div>
          <div className="foot-bottom">
            <span>Copyright 2025 KastoChha. Nepal ko real talk.</span>
            <span>Made with love in Kathmandu</span>
          </div>
        </div>
      </footer>

      <div className="modal-bg" id="modal-bg" onClick={closeBg}>
        <div className="modal">
          <div className="modal-head">
            <div className="modal-tabs">
              <button type="button" className="mtab on" id="tab-share" onClick={() => switchMTab("share")}>Share Experience</button>
              <button type="button" className="mtab" id="tab-ask" onClick={() => switchMTab("ask")}>Ask a Question</button>
            </div>
            <button type="button" className="modal-x" onClick={closeModal}>x</button>
          </div>

          <div className="mpanel on" id="mp-share">
            <div className="prog" style={{ marginTop: "18px" }}>
              <div className="pseg" id="sp1"></div><div className="pseg" id="sp2"></div>
              <div className="pseg" id="sp3"></div><div className="pseg" id="sp4"></div><div className="pseg" id="sp5"></div>
            </div>
            <div className="fg">
              <div className="flbl"><span className="fstep">1</span>Topic</div>
              <input className="finp" id="sh-topic" type="text" placeholder="e.g. delivery experience" onInput={calcProg} />
            </div>
            <div className="fg">
              <div className="flbl"><span className="fstep">2</span>Verdict</div>
              <div className="vgrid">
                <button type="button" className="vbtn-m ramro" id="vr" onClick={() => pickV("ramro")}>Ramro chha</button>
                <button type="button" className="vbtn-m thikai" id="vt" onClick={() => pickV("thikai")}>Thikai chha</button>
                <button type="button" className="vbtn-m naramro" id="vn" onClick={() => pickV("naramro")}>Naramro chha</button>
              </div>
            </div>
            <div className="fg">
              <div className="flbl"><span className="fstep">3</span>Category</div>
              <div className="trow">
                <button type="button" className="tpill" onClick={(e) => toggleT(e.currentTarget)}>Technology</button>
                <button type="button" className="tpill" onClick={(e) => toggleT(e.currentTarget)}>Career</button>
                <button type="button" className="tpill" onClick={(e) => toggleT(e.currentTarget)}>Food</button>
                <button type="button" className="tpill" onClick={(e) => toggleT(e.currentTarget)}>Education</button>
                <button type="button" className="tpill" onClick={(e) => toggleT(e.currentTarget)}>Finance</button>
                <button type="button" className="tpill" onClick={(e) => toggleT(e.currentTarget)}>Housing</button>
                <button type="button" className="tpill" onClick={(e) => toggleT(e.currentTarget)}>Lifestyle</button>
              </div>
            </div>
            <div className="fg">
              <div className="flbl"><span className="fstep">4</span>Your Experience</div>
              <textarea className="fta" id="sh-exp" placeholder="Tapai ko real experience share garnus. Cost, time, ra service mention gare ramro." onInput={calcProg}></textarea>
            </div>
            <div className="fg">
              <div className="flbl">
                <span className="fstep">5</span>
                Context{" "}
                <span style={{ fontSize: ".55rem", color: "var(--muted2)", marginLeft: "4px" }}>OPTIONAL</span>
              </div>
              <div className="f2col">
                <select className="fsel">
                  <option value="">Location</option>
                  <option>Kathmandu</option>
                  <option>Lalitpur</option>
                  <option>Bhaktapur</option>
                  <option>Pokhara</option>
                  <option>Other</option>
                </select>
                <select className="fsel">
                  <option value="">User Type</option>
                  <option>Student</option>
                  <option>Professional</option>
                  <option>Business Owner</option>
                  <option>Homemaker</option>
                </select>
              </div>
            </div>
            <button type="button" className="fsub" onClick={() => submitForm("share")}>
              Share Experience -&gt;
            </button>
          </div>

          <div className="mpanel" id="mp-ask">
            <div className="fg" style={{ marginTop: "18px" }}>
              <div className="flbl">Your Question</div>
              <textarea className="fta" id="ask-q" placeholder="Tapai ko question type garnus... (e.g. warranty kasto chha?)"></textarea>
              {suggestedQuestions.length > 0 ? (
                <div className="ex-chips">
                  {suggestedQuestions.map((label) => (
                    <button
                      key={label}
                      type="button"
                      className="ex-c"
                      onClick={() => fillAsk(label)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="fg">
              <div className="flbl">Category</div>
              <select className="fsel" id="ask-cat">
                <option value="">Select category...</option>
                <option>Food</option>
                <option>Career</option>
                <option>Housing</option>
                <option>Education</option>
                <option>Technology</option>
                <option>Finance</option>
                <option>Lifestyle</option>
              </select>
            </div>
            <button type="button" className="fsub" style={{ marginTop: "6px" }} onClick={() => submitForm("ask")}>
              Post Question -&gt;
            </button>
          </div>

          <div className="m-success" id="suc-share">
            <div className="msuc-ico g"><IconCheck className="icon" /></div>
            <h3>Experience Shared!</h3>
            <p>Tapai ko experience live cha.<br />Sathi haru padhdai chan. Dhanyabad!</p>
            <button type="button" className="msuc-btn" onClick={resetModal}>Share Another -&gt;</button>
          </div>
          <div className="m-success" id="suc-ask">
            <div className="msuc-ico b"><IconChat className="icon" /></div>
            <h3>Question Posted!</h3>
            <p>Tapai ko question live cha.<br />Reply aauna thap time lagna sakcha, tara aaucha.</p>
            <button type="button" className="msuc-btn" onClick={resetModal}>Ask Another -&gt;</button>
          </div>
        </div>
      </div>
    </>
  );
}
