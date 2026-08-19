;(() => {
  const CPLC = window.CPLC

  function runAutoScroll(directionHint) {
    if (CPLC.isUserTyping && CPLC.isUserTyping()) return
    if (!CPLC.state.settings.autoScroll) return

    const sc = CPLC.scroll.getScrollContainer()
    if (!sc) return

    const st = sc.scrollTop
    const maxScroll = sc.scrollHeight - sc.clientHeight
    const remainingBottom = maxScroll - st

    const direction = directionHint || (st < CPLC.state.lastScrollTop ? 'up' : 'down')
    CPLC.state.lastScrollTop = st

    const nearTop = st <= CPLC.state.settings.topThreshold
    const nearBottom = remainingBottom <= CPLC.state.settings.bottomThreshold

    if (direction === 'up' && nearTop) CPLC.visibility.revealOne()
    if (direction === 'down' && nearBottom) CPLC.visibility.hideOne()
  }

  function onAnyScroll(e) {
    if (CPLC.isUserTyping && CPLC.isUserTyping()) return

    CPLC.scroll.setScrollContainerFromEventTarget(e?.target)

    if (CPLC.state.ticking) return
    CPLC.state.ticking = true

    requestAnimationFrame(() => {
      runAutoScroll()
      CPLC.state.ticking = false
    })
  }

  function onWheel(e) {
    if (CPLC.isUserTyping && CPLC.isUserTyping()) return
    if (!CPLC.state.settings.autoScroll) return

    CPLC.scroll.setScrollContainerFromEventTarget(e?.target)

    const dir = e.deltaY < 0 ? 'up' : 'down'

    if (CPLC.state.ticking) return
    CPLC.state.ticking = true

    requestAnimationFrame(() => {
      runAutoScroll(dir)
      CPLC.state.ticking = false
    })
  }

  function getChatGptJumpNavigation(button) {
    if (!button || button.closest('#cplc-toolbar')) return null

    const list = button.closest('ul')
    const fixedRoot = list?.closest('.fixed')

    if (!list || !fixedRoot) return null

    // ChatGPT's conversation jump navigation is fixed halfway down the
    // right-hand side. Keep this deliberately narrow so other popovers do not
    // cause the full conversation to be revealed.
    if (!fixedRoot.classList.contains('inset-e-4') || !fixedRoot.classList.contains('top-1/2')) {
      return null
    }

    const buttons = Array.from(list.querySelectorAll('li button'))
    const buttonIndex = buttons.indexOf(button)

    if (buttonIndex === -1) return null

    return { buttonIndex, buttons }
  }

  function getUserTurns(turns) {
    const userMessages = Array.from(document.querySelectorAll('[data-message-author-role="user"]'))

    return CPLC.uniq(
      userMessages
        .map((message) => turns.find((turn) => turn === message || turn.contains(message)))
        .filter(Boolean),
    )
  }

  function revealForChatGptJump(buttonIndex, navigationButtons) {
    const turns = CPLC.dom.getTurnElements()
    if (!turns.length) return

    const userTurns = getUserTurns(turns)

    // The navigation contains one item per user prompt. If ChatGPT changes that
    // relationship, reveal everything as a compatibility fallback rather than
    // allowing its native jump to stop at the wrong position.
    let requiredVisible = turns.length

    if (userTurns.length === navigationButtons.length) {
      const targetTurn = userTurns[buttonIndex]
      const targetIndex = turns.indexOf(targetTurn)

      if (targetIndex !== -1) {
        requiredVisible = turns.length - targetIndex
      }
    }

    if (requiredVisible <= CPLC.state.expandedVisible) return

    CPLC.state.expandedVisible = requiredVisible

    // This must happen synchronously, before ChatGPT's own click handler tries
    // to measure and scroll to the target. preserveViewport() would compete
    // with that native scroll, so apply visibility directly here.
    CPLC.visibility.applyVisibility()

    requestAnimationFrame(() => {
      CPLC.toolbar?.update?.()
    })
  }

  function onClick(e) {
    const target = e.target
    if (!(target instanceof Element)) return

    const button = target.closest('button')
    const navigation = getChatGptJumpNavigation(button)
    if (!navigation) return

    revealForChatGptJump(navigation.buttonIndex, navigation.buttons)
  }

  function ensureHooks() {
    if (CPLC.state.hooksAttached) return
    CPLC.state.hooksAttached = true

    document.addEventListener('scroll', onAnyScroll, { capture: true, passive: true })
    document.addEventListener('wheel', onWheel, { capture: true, passive: true })
    document.addEventListener('touchmove', onAnyScroll, { capture: true, passive: true })
    document.addEventListener('click', onClick, { capture: true })
  }

  CPLC.autoScroll = { ensureHooks }
})()
