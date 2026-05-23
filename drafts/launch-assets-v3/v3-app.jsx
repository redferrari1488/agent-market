/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard,
   V3PostHero, V3PostStories, V3PostRiso, V3Post4Stat,
   V3PostNoDevs, V3PostSMBPains, V3PostChatStory, V3PostNoDevWide,
   V3LockinChat, V3LockinNote, V3LockinSticker, V3LockinSplit, V3LockinAgentCard, V3LockinWide */

function App() {
  return (
    <DesignCanvas
      title="v3 · переделка"
      subtitle="fix шрифтов · убраны источники · фокус на РУ СМБ · lock-in дружески (без OFFICIAL COLLAB)"
    >
      <DCSection
        id="smb"
        title="РУ СМБ — кафе / салон / магазин / студия"
      >
        <DCArtboard id="v3-smb1" label="«без разработчиков»" width={1080} height={1080}>
          <V3PostNoDevs />
        </DCArtboard>
        <DCArtboard id="v3-smb2" label="4 рутины СМБ" width={1080} height={1080}>
          <V3PostSMBPains />
        </DCArtboard>
        <DCArtboard id="v3-smb3" label="ответил, пока вы спали" width={1080} height={1080}>
          <V3PostChatStory />
        </DCArtboard>
        <DCArtboard id="v3-smb4" label="широкий · без разработчиков" width={1600} height={900}>
          <V3PostNoDevWide />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="stats"
        title="Статистика — без источников, исправленные шрифты"
      >
        <DCArtboard id="v3-stats-hero" label="hero $5.4B → $47B (исправлено)" width={1600} height={900}>
          <V3PostHero />
        </DCArtboard>
        <DCArtboard id="v3-stats-riso" label="riso curve cream (исправлено)" width={1600} height={900}>
          <V3PostRiso />
        </DCArtboard>
        <DCArtboard id="v3-stats-4" label="4 цифры (исправлено)" width={1080} height={1080}>
          <V3Post4Stat />
        </DCArtboard>
        <DCArtboard id="v3-stats-stories" label="stories — B больше не вылезает" width={1080} height={1920}>
          <V3PostStories />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="lockin"
        title="hire.on × LOCK·IN — дружеская коллаба, без OFFICIAL"
      >
        <DCArtboard id="v3-li-chat" label="01 · sms-чат" width={1080} height={1080}>
          <V3LockinChat />
        </DCArtboard>
        <DCArtboard id="v3-li-note" label="02 · записка на холодильнике" width={1080} height={1080}>
          <V3LockinNote />
        </DCArtboard>
        <DCArtboard id="v3-li-sticker" label="03 · sticker / pin-badge" width={1080} height={1080}>
          <V3LockinSticker />
        </DCArtboard>
        <DCArtboard id="v3-li-split" label="04 · split (без OFFICIAL)" width={1080} height={1080}>
          <V3LockinSplit />
        </DCArtboard>
        <DCArtboard id="v3-li-card" label="05 · агент-карточка с «by lock-in»" width={800} height={800}>
          <V3LockinAgentCard />
        </DCArtboard>
        <DCArtboard id="v3-li-wide" label="06 · широкий 1600×900" width={1600} height={900}>
          <V3LockinWide />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
