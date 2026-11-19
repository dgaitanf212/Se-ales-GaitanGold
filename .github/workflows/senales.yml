name: senales
on:
  schedule:
    - cron: '3,33 * * * *'
  workflow_dispatch:
    inputs:
      prueba:
        description: 'Escribe si para mandar un mensaje de prueba'
        default: 'no'
permissions:
  contents: write
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: node monitor.mjs
        env:
          TD_KEY: ${{ secrets.TD_KEY }}
          TG_TOKEN: ${{ secrets.TG_TOKEN }}
          TG_CHAT: ${{ secrets.TG_CHAT }}
          TEST: ${{ github.event.inputs.prueba }}
      - run: |
          git config user.name robot
          git config user.email robot@users.noreply.github.com
          git add state.json
          git diff --cached --quiet || (git commit -m estado && git push)
