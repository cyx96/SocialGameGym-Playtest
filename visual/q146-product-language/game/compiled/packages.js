window.GAME_UI_PACKAGES = {
  "status": "design-workbench-with-synthetic-fixtures-not-production-payload",
  "schemaVersion": "a6.game-ui/0.1",
  "catalogVersion": "a6.catalog/0.1",
  "paletteRevision": "372d0183f5ccf972205e593e7d6be9d044fbb4002321a5b99d955a8a8d1413b0",
  "games": [
    {
      "schemaVersion": "a6.game-ui/0.1",
      "id": "information",
      "name": "路径上的成本性信息传递",
      "theme": "information",
      "source": {
        "path": "docs/games/library/candidates/021-information-transmission-on-a-fixed-network.md",
        "sha256": "5ef6a1bb9f8942ab4e9caceb1bfd7dceaa4518a2c26b94bd799c6cf6544786e0",
        "status": "candidate"
      },
      "brief": "向路径上的邻居传递线索，尝试找出隐藏答案。有人答对，全体各得3点；发送或答错会扣除自己的收益。",
      "poster": {
        "scene": "三个人站在相连的窄纸廊上，手中不同纸片传向近邻；不画隐藏答案，也不表现完整转发链。",
        "status": "prompt-only",
        "motion": "paused"
      },
      "configuration": {
        "sections": [
          {
            "label": "基础",
            "open": true,
            "fields": [
              {
                "key": "rounds",
                "kind": "integer",
                "label": "游戏轮数",
                "default": 4,
                "min": 1
              }
            ]
          }
        ]
      },
      "identities": {
        "self": {
          "name": "林舟",
          "avatar": "default-neutral"
        },
        "other": {
          "name": "许言",
          "avatar": "coordination"
        }
      },
      "release": {
        "projection": "fixture-only",
        "semanticReview": "source-checked-design-fixture",
        "visualReview": "pending",
        "poster": "not-generated"
      },
      "scenarios": [
        {
          "id": "decision",
          "label": "发送与回答",
          "viewer": "self",
          "round": "1/4 轮",
          "step": "游戏",
          "action": {
            "type": "Decision",
            "title": "这轮你想怎么做？",
            "description": "两项可以一起做，也可只做一项，或都不做。",
            "facts": [
              {
                "label": "你的线索",
                "value": "答案是0、1或2"
              },
              {
                "label": "你的邻居",
                "value": "许言"
              }
            ],
            "fields": [
              {
                "type": "Choice",
                "key": "send",
                "label": "发送线索",
                "required": true,
                "help": "每次花费0.25点，对方下一轮才能看到。",
                "options": [
                  {
                    "value": "none",
                    "label": "不发送"
                  },
                  {
                    "value": "q0",
                    "label": "告诉许言"
                  }
                ]
              },
              {
                "type": "Choice",
                "key": "answer",
                "label": "尝试回答",
                "required": true,
                "help": "答错扣0.5点；有人答对，每人获得3点。",
                "options": [
                  {
                    "value": "none",
                    "label": "不回答"
                  },
                  {
                    "value": "0",
                    "label": "0"
                  },
                  {
                    "value": "1",
                    "label": "1"
                  },
                  {
                    "value": "2",
                    "label": "2"
                  },
                  {
                    "value": "3",
                    "label": "3"
                  }
                ]
              }
            ],
            "submitLabel": "提交选择",
            "transport": {
              "actionId": "candidate021.choice",
              "completionMode": "lock_then_finish",
              "parameterMap": {
                "send": "send",
                "answer": "answer"
              }
            },
            "accepted": {
              "title": "已收到你的选择",
              "detail": "你的选择已锁定，完成这一步后一起结算。",
              "values": {
                "send": "q0",
                "answer": "none"
              },
              "finishRequired": true
            }
          },
          "records": {
            "action": [
              {
                "label": "本人已知线索",
                "value": "q0：{0, 1, 2}"
              }
            ],
            "accepted": [
              {
                "label": "本人已知线索",
                "value": "q0：{0, 1, 2}"
              },
              {
                "label": "第一轮本人选择",
                "value": "发送q0；不回答"
              }
            ],
            "waiting": [
              {
                "label": "本人已知线索",
                "value": "q0：{0, 1, 2}"
              },
              {
                "label": "第一轮本人选择",
                "value": "发送q0；不回答"
              }
            ],
            "unknown": [
              {
                "label": "本人已知线索",
                "value": "q0：{0, 1, 2}"
              }
            ],
            "result": [
              {
                "label": "本人发送次数",
                "value": "0次"
              },
              {
                "label": "本人回答次数",
                "value": "0次"
              },
              {
                "label": "本人行动成本",
                "value": "0点"
              }
            ],
            "configuration": []
          },
          "result": {
            "type": "Outcome",
            "headline": "未能找到答案",
            "summary": null,
            "metric": {
              "label": "我的净收益",
              "value": {
                "n": "0",
                "d": "1"
              },
              "unit": "点"
            },
            "facts": [],
            "artifact": null,
            "scope": "shared-goal-and-self",
            "provenance": "021末段失败例：全员4轮仅结束，无奖励与成本。行政winner=true/rank1不用于竞争展示；不公开答案。",
            "round": "4/4 轮"
          },
          "fixtureBasis": "操作来自完整例第一轮端点Alice（显示名林舟）的授权线索与邻居；终局另取全员不行动的失败夹具，非该操作轨迹续局。",
          "recordViews": {
            "configuration": {
              "groups": []
            },
            "action": {
              "groups": [
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "in-progress",
                  "recap": "等待你的选择",
                  "events": [
                    {
                      "id": "clue",
                      "type": "Moment",
                      "status": "confirmed",
                      "title": "本轮你掌握的线索",
                      "detail": "答案是0、1或2"
                    }
                  ]
                }
              ]
            },
            "unknown": {
              "groups": [
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "in-progress",
                  "recap": "等待你的选择",
                  "events": [
                    {
                      "id": "clue",
                      "type": "Moment",
                      "status": "confirmed",
                      "title": "本轮你掌握的线索",
                      "detail": "答案是0、1或2"
                    }
                  ]
                }
              ]
            },
            "accepted": {
              "groups": [
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "in-progress",
                  "recap": "已选择告诉许言，暂不回答",
                  "events": [
                    {
                      "id": "clue",
                      "type": "Moment",
                      "status": "confirmed",
                      "title": "本轮你掌握的线索",
                      "detail": "答案是0、1或2"
                    },
                    {
                      "id": "send",
                      "type": "Moment",
                      "status": "locked",
                      "title": "你选择告诉许言",
                      "detail": "内容：答案是0、1或2。选择已锁定，尚未送达。"
                    },
                    {
                      "id": "answer",
                      "type": "Moment",
                      "status": "locked",
                      "title": "你选择不回答"
                    }
                  ]
                }
              ]
            },
            "waiting": {
              "groups": [
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "in-progress",
                  "recap": "已选择告诉许言，暂不回答",
                  "events": [
                    {
                      "id": "clue",
                      "type": "Moment",
                      "status": "confirmed",
                      "title": "本轮你掌握的线索",
                      "detail": "答案是0、1或2"
                    },
                    {
                      "id": "send",
                      "type": "Moment",
                      "status": "locked",
                      "title": "你选择告诉许言",
                      "detail": "内容：答案是0、1或2。选择已锁定，尚未送达。"
                    },
                    {
                      "id": "answer",
                      "type": "Moment",
                      "status": "locked",
                      "title": "你选择不回答"
                    }
                  ]
                }
              ]
            },
            "result": {
              "groups": [
                {
                  "id": "round-4",
                  "round": 4,
                  "title": "第4轮",
                  "status": "complete",
                  "recap": "你本轮没有发送或回答",
                  "events": [
                    {
                      "id": "no-action",
                      "type": "Moment",
                      "status": "confirmed",
                      "title": "你本轮没有发送或回答",
                      "detail": "本轮直接结束，没有行动成本。"
                    }
                  ],
                  "metric": {
                    "label": "净收益",
                    "value": "0",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-3",
                  "round": 3,
                  "title": "第3轮",
                  "status": "complete",
                  "recap": "你本轮没有发送或回答",
                  "events": [
                    {
                      "id": "no-action",
                      "type": "Moment",
                      "status": "confirmed",
                      "title": "你本轮没有发送或回答",
                      "detail": "本轮直接结束，没有行动成本。"
                    }
                  ],
                  "metric": {
                    "label": "净收益",
                    "value": "0",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-2",
                  "round": 2,
                  "title": "第2轮",
                  "status": "complete",
                  "recap": "你本轮没有发送或回答",
                  "events": [
                    {
                      "id": "no-action",
                      "type": "Moment",
                      "status": "confirmed",
                      "title": "你本轮没有发送或回答",
                      "detail": "本轮直接结束，没有行动成本。"
                    }
                  ],
                  "metric": {
                    "label": "净收益",
                    "value": "0",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "complete",
                  "recap": "你本轮没有发送或回答",
                  "events": [
                    {
                      "id": "no-action",
                      "type": "Moment",
                      "status": "confirmed",
                      "title": "你本轮没有发送或回答",
                      "detail": "本轮直接结束，没有行动成本。"
                    }
                  ],
                  "metric": {
                    "label": "净收益",
                    "value": "0",
                    "unit": "点",
                    "signed": false
                  }
                }
              ]
            }
          }
        }
      ],
      "recordPresentation": {
        "version": "a6.game-records/0.2",
        "scope": "game-only",
        "groupBy": "round",
        "order": "newest-first",
        "purpose": "快速复盘某一轮发生了什么",
        "salience": [
          "影响本轮的已知行动",
          "行动造成的已知变化",
          "已结算的本轮结果及本人影响"
        ],
        "projection": "server-authorized-reader-view-required",
        "history": "round-index-and-authorized-round-detail; no-client-global-filter",
        "review": {
          "sourceChecked": true,
          "realProjection": "pending",
          "visual": "representative-static-reviewed"
        },
        "important": "本人当时已知线索、直接收发及实际送达状态、本人回答与已知结果/成本。隐藏答案及全网转发链不进入投影。",
        "fixtureBasis": "021第一轮锁定发送与全员四轮仅结束的终局为不同夹具轨迹；未发送不是主动选择按钮的证据。",
        "numberPolicy": "a6.numbers/0.1"
      },
      "numberPolicy": "a6.numbers/0.1",
      "colors": {
        "ink": "#4a5391",
        "mid": "#8c99dd",
        "wash": "#e7ebf8",
        "paper": "#f9fafc",
        "canvas": "#fafbfc",
        "surface": "#ffffff",
        "label": "#202126",
        "secondary": "#56585f",
        "line": "#cccdd2"
      },
      "definitionHash": "3dc30d16c5e69f9c6ed95a63c071244882dd93ff3a0a0514f1165135ee040357"
    },
    {
      "schemaVersion": "a6.game-ui/0.1",
      "id": "intergroup",
      "name": "群际历史与共同目标",
      "theme": "competition",
      "source": {
        "path": "docs/games/library/candidates/128-intergroup-history-and-a-shared-goal.md",
        "sha256": "d636730020f0a8ca38639275dac83750b62aed0c85b7f58dfc71d3d682d24607",
        "status": "candidate"
      },
      "brief": "先进行组间竞争，再共同投入一项需要两组参与的任务。分别获得阶段奖励并扣除自己的投入，整场不另选总冠军。",
      "poster": {
        "scene": "两组人物先立于分开的纸台，随后共同托起一段跨越两岸的纸桥；不画和解结论或总冠军。",
        "status": "prompt-only",
        "motion": "paused"
      },
      "configuration": {
        "sections": [
          {
            "label": "基础",
            "open": true,
            "fields": [
              {
                "key": "rounds",
                "kind": "integer",
                "label": "游戏轮数",
                "default": 1,
                "min": 1
              }
            ]
          }
        ]
      },
      "identities": {
        "self": {
          "name": "林舟",
          "avatar": "default-neutral"
        },
        "other": {
          "name": "许言",
          "avatar": "coordination"
        }
      },
      "release": {
        "projection": "fixture-only",
        "semanticReview": "source-checked-design-fixture",
        "visualReview": "pending",
        "poster": "not-generated"
      },
      "scenarios": [
        {
          "id": "contribute",
          "label": "共同投入",
          "viewer": "self",
          "round": "1/1 轮",
          "step": "游戏 · 2/2 步",
          "action": {
            "type": "Decision",
            "title": "为共同目标投入多少？",
            "description": "两组各至少投入1点，合计达到5点后，每人获得6点。",
            "facts": [
              {
                "label": "你所在的组",
                "value": "A组"
              },
              {
                "label": "刚才的竞争",
                "value": "A组胜出"
              }
            ],
            "fields": [
              {
                "type": "IntegerChoice",
                "key": "amount",
                "label": "共同投入点数",
                "min": 0,
                "max": 4,
                "unit": "点",
                "required": true
              }
            ],
            "submitLabel": "投入",
            "transport": {
              "actionId": "candidate128.contribute",
              "completionMode": "lock_then_finish",
              "parameterMap": {
                "amount": "y"
              }
            },
            "accepted": {
              "title": "已锁定3点投入",
              "detail": "你的投入已锁定，完成这一步后一起结算。",
              "values": {
                "amount": 3
              },
              "finishRequired": true
            },
            "submitTemplate": "投入{amount}点"
          },
          "records": {
            "action": [
              {
                "label": "竞争阶段 · 我的投入",
                "value": "1点"
              },
              {
                "label": "竞争结果",
                "value": "A组胜出"
              }
            ],
            "accepted": [
              {
                "label": "竞争阶段 · 我的投入",
                "value": "1点"
              },
              {
                "label": "竞争结果",
                "value": "A组胜出"
              },
              {
                "label": "共同阶段 · 我的锁定投入",
                "value": "3点"
              }
            ],
            "waiting": [
              {
                "label": "竞争阶段 · 我的投入",
                "value": "1点"
              },
              {
                "label": "竞争结果",
                "value": "A组胜出"
              },
              {
                "label": "共同阶段 · 我的锁定投入",
                "value": "3点"
              }
            ],
            "unknown": [
              {
                "label": "竞争阶段 · 我的投入",
                "value": "1点"
              },
              {
                "label": "竞争结果",
                "value": "A组胜出"
              }
            ],
            "result": [
              {
                "label": "竞争阶段 · 我的投入",
                "value": "1 点"
              },
              {
                "label": "共同阶段 · 我的投入",
                "value": "3 点"
              },
              {
                "label": "共同总投入 / 门槛",
                "value": "5 / 5 点"
              }
            ],
            "configuration": []
          },
          "result": {
            "type": "Outcome",
            "headline": "A组胜出，共同目标达成",
            "summary": "两组都至少投入1点，合计达到5点。",
            "metric": {
              "label": "我的净收益",
              "value": {
                "n": "6",
                "d": "1"
              },
              "unit": "点"
            },
            "facts": [
              {
                "label": "组间竞争",
                "numeric": {
                  "n": "3",
                  "d": "1"
                },
                "unit": "点",
                "signed": true
              },
              {
                "label": "共同目标",
                "numeric": {
                  "n": "3",
                  "d": "1"
                },
                "unit": "点",
                "signed": true
              }
            ],
            "artifact": null,
            "scope": "multiple-phase-outcomes",
            "provenance": "128完整例N2R1：竞争(1,0)，共同(3,2)，本人A组累计6；无全局赢家。",
            "round": "1/1 轮",
            "headlineLines": [
              "A组胜出",
              "共同目标达成"
            ]
          },
          "fixtureBasis": "完整规则例共同阶段，只显示已经公开的竞争结果，不披露同时共同投入。",
          "recordViews": {
            "configuration": {
              "groups": []
            },
            "action": {
              "groups": [
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "in-progress",
                  "recap": "A组赢得竞争，共同阶段进行中",
                  "events": [
                    {
                      "id": "competition",
                      "type": "PhaseResult",
                      "status": "settled",
                      "phase": "组间竞争",
                      "title": "A组胜出",
                      "facts": [
                        {
                          "label": "你的投入",
                          "numeric": {
                            "n": "1",
                            "d": "1"
                          },
                          "unit": "点"
                        },
                        {
                          "label": "你的净收益",
                          "numeric": {
                            "n": "3",
                            "d": "1"
                          },
                          "unit": "点",
                          "signed": true
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            "unknown": {
              "groups": [
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "in-progress",
                  "recap": "A组赢得竞争，共同阶段进行中",
                  "events": [
                    {
                      "id": "competition",
                      "type": "PhaseResult",
                      "status": "settled",
                      "phase": "组间竞争",
                      "title": "A组胜出",
                      "facts": [
                        {
                          "label": "你的投入",
                          "numeric": {
                            "n": "1",
                            "d": "1"
                          },
                          "unit": "点"
                        },
                        {
                          "label": "你的净收益",
                          "numeric": {
                            "n": "3",
                            "d": "1"
                          },
                          "unit": "点",
                          "signed": true
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            "accepted": {
              "groups": [
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "in-progress",
                  "recap": "A组赢得竞争，你已锁定共同投入",
                  "events": [
                    {
                      "id": "competition",
                      "type": "PhaseResult",
                      "status": "settled",
                      "phase": "组间竞争",
                      "title": "A组胜出",
                      "facts": [
                        {
                          "label": "你的投入",
                          "numeric": {
                            "n": "1",
                            "d": "1"
                          },
                          "unit": "点"
                        },
                        {
                          "label": "你的净收益",
                          "numeric": {
                            "n": "3",
                            "d": "1"
                          },
                          "unit": "点",
                          "signed": true
                        }
                      ]
                    },
                    {
                      "id": "contribution",
                      "type": "Moment",
                      "status": "locked",
                      "title": "你已锁定3点共同投入",
                      "detail": "尚未公布其他人的投入或共同结果。"
                    }
                  ]
                }
              ]
            },
            "waiting": {
              "groups": [
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "in-progress",
                  "recap": "A组赢得竞争，你已锁定共同投入",
                  "events": [
                    {
                      "id": "competition",
                      "type": "PhaseResult",
                      "status": "settled",
                      "phase": "组间竞争",
                      "title": "A组胜出",
                      "facts": [
                        {
                          "label": "你的投入",
                          "numeric": {
                            "n": "1",
                            "d": "1"
                          },
                          "unit": "点"
                        },
                        {
                          "label": "你的净收益",
                          "numeric": {
                            "n": "3",
                            "d": "1"
                          },
                          "unit": "点",
                          "signed": true
                        }
                      ]
                    },
                    {
                      "id": "contribution",
                      "type": "Moment",
                      "status": "locked",
                      "title": "你已锁定3点共同投入",
                      "detail": "尚未公布其他人的投入或共同结果。"
                    }
                  ]
                }
              ]
            },
            "result": {
              "groups": [
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "complete",
                  "recap": "A组赢得竞争，随后共同目标达成",
                  "events": [
                    {
                      "id": "competition",
                      "type": "PhaseResult",
                      "status": "settled",
                      "phase": "组间竞争",
                      "title": "A组胜出",
                      "facts": [
                        {
                          "label": "你的投入",
                          "numeric": {
                            "n": "1",
                            "d": "1"
                          },
                          "unit": "点"
                        },
                        {
                          "label": "你的净收益",
                          "numeric": {
                            "n": "3",
                            "d": "1"
                          },
                          "unit": "点",
                          "signed": true
                        }
                      ]
                    },
                    {
                      "id": "joint",
                      "type": "PhaseResult",
                      "status": "settled",
                      "phase": "共同目标",
                      "title": "共同目标达成",
                      "detail": "两组均至少投入1点，合计5点，达到目标。",
                      "facts": [
                        {
                          "label": "A组 / B组投入",
                          "quantities": [
                            {
                              "value": {
                                "n": "3",
                                "d": "1"
                              },
                              "unit": "点"
                            },
                            {
                              "value": {
                                "n": "2",
                                "d": "1"
                              },
                              "unit": "点"
                            }
                          ]
                        },
                        {
                          "label": "你的净收益",
                          "numeric": {
                            "n": "3",
                            "d": "1"
                          },
                          "unit": "点",
                          "signed": true
                        }
                      ]
                    }
                  ],
                  "metric": {
                    "label": "净收益",
                    "value": "6",
                    "unit": "点",
                    "signed": true
                  }
                }
              ]
            }
          }
        }
      ],
      "recordPresentation": {
        "version": "a6.game-records/0.2",
        "scope": "game-only",
        "groupBy": "round",
        "order": "newest-first",
        "purpose": "快速复盘某一轮发生了什么",
        "salience": [
          "影响本轮的已知行动",
          "行动造成的已知变化",
          "已结算的本轮结果及本人影响"
        ],
        "projection": "server-authorized-reader-view-required",
        "history": "round-index-and-authorized-round-detail; no-client-global-filter",
        "review": {
          "sourceChecked": true,
          "realProjection": "pending",
          "visual": "representative-static-reviewed"
        },
        "important": "一轮内按阶段顺序展示已公布的竞争与共同目标结果、贡献和本人净收益；不造总冠军，不提前公开同时投入。",
        "fixtureBasis": "128 N2 R1，竞争投入(1,0)，共同投入(3,2)；本人A组，共同结果仅在终局夹具公开。",
        "numberPolicy": "a6.numbers/0.1"
      },
      "numberPolicy": "a6.numbers/0.1",
      "colors": {
        "ink": "#5e4d8b",
        "mid": "#a392d6",
        "wash": "#ece9f6",
        "paper": "#faf9fc",
        "canvas": "#fbfafc",
        "surface": "#ffffff",
        "label": "#222125",
        "secondary": "#58575e",
        "line": "#cecdd1"
      },
      "definitionHash": "0f92616eeff9fac3b14dafb56279217c65713a020627f7b7c65204394a38bda3"
    },
    {
      "schemaVersion": "a6.game-ui/0.1",
      "id": "trust",
      "name": "信任游戏",
      "theme": "trust",
      "source": {
        "path": "games/trust/rules/legacy/066-trust.md",
        "sha256": "d4641551a2ccb8d5ea6bdfe518c974983bca1f47893a21ccc1ed0546235daf19",
        "status": "formal-design-rule"
      },
      "brief": "委托人转出的资源放大三倍，由受托人决定返还多少。双人方向固定，多人按有向环依次互动；固定轮数后按累计得分确定名次。",
      "poster": {
        "scene": "两个人隔着溪谷交换一条由窄变宽的纸带，连接关系清楚，人物同等视觉权重。",
        "status": "prompt-only",
        "motion": "paused"
      },
      "configuration": {
        "sections": [
          {
            "label": "基础",
            "open": true,
            "fields": [
              {
                "key": "rounds",
                "kind": "integer",
                "label": "游戏轮数",
                "default": 5,
                "min": 1
              }
            ]
          },
          {
            "label": "社交",
            "open": false,
            "fields": [
              {
                "key": "profile",
                "kind": "quota",
                "label": "资料",
                "default": 1,
                "min": 0
              },
              {
                "key": "forum",
                "kind": "quota",
                "label": "论坛",
                "default": 1,
                "min": 0
              },
              {
                "key": "mail",
                "kind": "quota",
                "label": "私信",
                "default": 1,
                "min": 0
              },
              {
                "key": "rating",
                "kind": "quota",
                "label": "评分",
                "default": 1,
                "min": 0
              }
            ]
          }
        ]
      },
      "identities": {
        "self": {
          "name": "林舟",
          "avatar": "default-neutral"
        },
        "other": {
          "name": "许言",
          "avatar": "coordination"
        }
      },
      "release": {
        "projection": "fixture-only",
        "semanticReview": "source-checked-design-fixture",
        "visualReview": "pending",
        "poster": "not-generated"
      },
      "scenarios": [
        {
          "id": "transfer",
          "label": "转出",
          "viewer": "self",
          "round": "5/5 轮",
          "step": "游戏 · 1/2 步",
          "action": {
            "type": "Decision",
            "title": "转出多少？",
            "description": "这次你有4点，转出后会变为3倍交给对方。",
            "facts": [],
            "fields": [
              {
                "type": "IntegerChoice",
                "key": "amount",
                "label": "转出点数",
                "min": 0,
                "max": 4,
                "required": true,
                "unit": "点"
              }
            ],
            "preview": {
              "field": "amount",
              "options": {
                "0": {
                  "title": "对方收到 0 点",
                  "detail": "你暂留 4 点，最终收益取决于对方返还。"
                },
                "1": {
                  "title": "对方收到 3 点",
                  "detail": "你暂留 3 点，最终收益取决于对方返还。"
                },
                "2": {
                  "title": "对方收到 6 点",
                  "detail": "你暂留 2 点，最终收益取决于对方返还。"
                },
                "3": {
                  "title": "对方收到 9 点",
                  "detail": "你暂留 1 点，最终收益取决于对方返还。"
                },
                "4": {
                  "title": "对方收到 12 点",
                  "detail": "你暂留 0 点，最终收益取决于对方返还。"
                }
              }
            },
            "submitLabel": "转出",
            "transport": {
              "actionId": "game.trust.transfer",
              "completionMode": "submit_and_complete",
              "parameterMap": {
                "amount": "x"
              }
            },
            "accepted": {
              "title": "已转出2点",
              "detail": "等待对方决定返还多少。",
              "values": {
                "amount": 2
              },
              "finishRequired": false
            },
            "submitTemplate": "转出{amount}点"
          },
          "records": {
            "action": [
              {
                "label": "第4轮 · 转出",
                "value": "2 点"
              },
              {
                "label": "第4轮 · 返还",
                "value": "3 点"
              }
            ],
            "accepted": [
              {
                "label": "第4轮 · 转出",
                "value": "2 点"
              },
              {
                "label": "第4轮 · 返还",
                "value": "3 点"
              },
              {
                "label": "第5轮 · 你已转出",
                "value": "2 点"
              }
            ],
            "waiting": [
              {
                "label": "第4轮 · 转出",
                "value": "2 点"
              },
              {
                "label": "第4轮 · 返还",
                "value": "3 点"
              },
              {
                "label": "第5轮 · 你已转出",
                "value": "2 点"
              }
            ],
            "unknown": [
              {
                "label": "第4轮 · 转出",
                "value": "2 点"
              },
              {
                "label": "第4轮 · 返还",
                "value": "3 点"
              }
            ],
            "result": [
              {
                "label": "第5轮 · 转出",
                "value": "2 点"
              },
              {
                "label": "第5轮 · 返还",
                "value": "3 点"
              }
            ],
            "configuration": []
          },
          "result": {
            "type": "Outcome",
            "headline": "本场获胜",
            "summary": null,
            "metric": {
              "label": "累计得分",
              "value": {
                "n": "25",
                "d": "1"
              },
              "unit": "点"
            },
            "facts": [
              {
                "label": "本场名次",
                "value": "第1名"
              }
            ],
            "artifact": null,
            "scope": "self",
            "provenance": "G066-RESULT/PAYOFF；N=2,R=5，每轮x2,y3；本人委托人25点，第1名",
            "round": "5/5 轮"
          },
          "fixtureBasis": "N=2固定方向；此场景切换读者而非交换角色。已受理/终局为分离的授权夹具，不由页面选项推导。",
          "recordViews": {
            "configuration": {
              "groups": []
            },
            "action": {
              "groups": [
                {
                  "id": "round-5",
                  "round": 5,
                  "title": "第5轮",
                  "status": "in-progress",
                  "recap": "本轮还没有已确认的动作",
                  "events": []
                },
                {
                  "id": "round-4",
                  "round": 4,
                  "title": "第4轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "对方收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "5",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-3",
                  "round": 3,
                  "title": "第3轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "对方收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "5",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-2",
                  "round": 2,
                  "title": "第2轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "对方收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "5",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "对方收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "5",
                    "unit": "点",
                    "signed": false
                  }
                }
              ]
            },
            "unknown": {
              "groups": [
                {
                  "id": "round-5",
                  "round": 5,
                  "title": "第5轮",
                  "status": "in-progress",
                  "recap": "本轮还没有已确认的动作",
                  "events": []
                },
                {
                  "id": "round-4",
                  "round": 4,
                  "title": "第4轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "对方收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "5",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-3",
                  "round": 3,
                  "title": "第3轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "对方收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "5",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-2",
                  "round": 2,
                  "title": "第2轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "对方收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "5",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "对方收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "5",
                    "unit": "点",
                    "signed": false
                  }
                }
              ]
            },
            "accepted": {
              "groups": [
                {
                  "id": "round-5",
                  "round": 5,
                  "title": "第5轮",
                  "status": "in-progress",
                  "recap": "已转出2点，等待返还",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "对方收到放大后的6点"
                    }
                  ]
                },
                {
                  "id": "round-4",
                  "round": 4,
                  "title": "第4轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "对方收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "5",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-3",
                  "round": 3,
                  "title": "第3轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "对方收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "5",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-2",
                  "round": 2,
                  "title": "第2轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "对方收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "5",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "对方收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "5",
                    "unit": "点",
                    "signed": false
                  }
                }
              ]
            },
            "waiting": {
              "groups": [
                {
                  "id": "round-5",
                  "round": 5,
                  "title": "第5轮",
                  "status": "in-progress",
                  "recap": "已转出2点，等待返还",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "对方收到放大后的6点"
                    }
                  ]
                },
                {
                  "id": "round-4",
                  "round": 4,
                  "title": "第4轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "对方收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "5",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-3",
                  "round": 3,
                  "title": "第3轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "对方收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "5",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-2",
                  "round": 2,
                  "title": "第2轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "对方收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "5",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "对方收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "5",
                    "unit": "点",
                    "signed": false
                  }
                }
              ]
            },
            "result": {
              "groups": [
                {
                  "id": "round-5",
                  "round": 5,
                  "title": "第5轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "对方收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "5",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-4",
                  "round": 4,
                  "title": "第4轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "对方收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "5",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-3",
                  "round": 3,
                  "title": "第3轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "对方收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "5",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-2",
                  "round": 2,
                  "title": "第2轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "对方收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "5",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "对方收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "5",
                    "unit": "点",
                    "signed": false
                  }
                }
              ]
            }
          }
        },
        {
          "id": "return",
          "label": "返还",
          "viewer": "other",
          "round": "5/5 轮",
          "step": "游戏 · 2/2 步",
          "action": {
            "type": "Decision",
            "title": "返还多少？",
            "description": "对方转出了2点，你收到放大后的6点。",
            "facts": [],
            "fields": [
              {
                "type": "IntegerChoice",
                "key": "amount",
                "label": "返还点数",
                "min": 0,
                "max": 6,
                "required": true,
                "unit": "点"
              }
            ],
            "preview": {
              "field": "amount",
              "options": {
                "0": {
                  "title": "对方得到 0 点",
                  "detail": "你保留 6 点"
                },
                "1": {
                  "title": "对方得到 1 点",
                  "detail": "你保留 5 点"
                },
                "2": {
                  "title": "对方得到 2 点",
                  "detail": "你保留 4 点"
                },
                "3": {
                  "title": "对方得到 3 点",
                  "detail": "你保留 3 点"
                },
                "4": {
                  "title": "对方得到 4 点",
                  "detail": "你保留 2 点"
                },
                "5": {
                  "title": "对方得到 5 点",
                  "detail": "你保留 1 点"
                },
                "6": {
                  "title": "对方得到 6 点",
                  "detail": "你保留 0 点"
                }
              }
            },
            "submitLabel": "返还",
            "transport": {
              "actionId": "game.trust.return",
              "completionMode": "submit_and_complete",
              "parameterMap": {
                "amount": "y"
              }
            },
            "accepted": {
              "title": "已返还3点",
              "detail": "这次互动已结束，正在更新结果。",
              "values": {
                "amount": 3
              },
              "finishRequired": false
            },
            "submitTemplate": "返还{amount}点"
          },
          "records": {
            "action": [
              {
                "label": "第4轮 · 转出",
                "value": "2 点"
              },
              {
                "label": "第4轮 · 返还",
                "value": "3 点"
              },
              {
                "label": "第5轮 · 对方向你转出",
                "value": "2 点，放大后收到6点"
              }
            ],
            "accepted": [
              {
                "label": "第5轮 · 转出",
                "value": "2 点"
              },
              {
                "label": "第5轮 · 返还",
                "value": "3 点"
              }
            ],
            "waiting": [
              {
                "label": "第5轮 · 转出",
                "value": "2 点"
              },
              {
                "label": "第5轮 · 返还",
                "value": "3 点"
              }
            ],
            "unknown": [
              {
                "label": "第4轮 · 转出",
                "value": "2 点"
              },
              {
                "label": "第4轮 · 返还",
                "value": "3 点"
              },
              {
                "label": "第5轮 · 对方向你转出",
                "value": "2 点，放大后收到6点"
              }
            ],
            "result": [
              {
                "label": "第5轮 · 转出",
                "value": "2 点"
              },
              {
                "label": "第5轮 · 返还",
                "value": "3 点"
              }
            ],
            "configuration": []
          },
          "result": {
            "type": "Outcome",
            "headline": "本场第2名",
            "summary": null,
            "metric": {
              "label": "累计得分",
              "value": {
                "n": "15",
                "d": "1"
              },
              "unit": "点"
            },
            "facts": [],
            "artifact": null,
            "scope": "self",
            "provenance": "G066-RESULT/PAYOFF；N=2,R=5，每轮x2,y3；本人受托人15点，第2名",
            "round": "5/5 轮"
          },
          "fixtureBasis": "N=2固定方向；此场景切换读者而非交换角色。已受理/终局为分离的授权夹具，不由页面选项推导。",
          "recordViews": {
            "configuration": {
              "groups": []
            },
            "action": {
              "groups": [
                {
                  "id": "round-5",
                  "round": 5,
                  "title": "第5轮",
                  "status": "in-progress",
                  "recap": "已转出2点，等待返还",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    }
                  ]
                },
                {
                  "id": "round-4",
                  "round": 4,
                  "title": "第4轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "3",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-3",
                  "round": 3,
                  "title": "第3轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "3",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-2",
                  "round": 2,
                  "title": "第2轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "3",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "3",
                    "unit": "点",
                    "signed": false
                  }
                }
              ]
            },
            "unknown": {
              "groups": [
                {
                  "id": "round-5",
                  "round": 5,
                  "title": "第5轮",
                  "status": "in-progress",
                  "recap": "已转出2点，等待返还",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    }
                  ]
                },
                {
                  "id": "round-4",
                  "round": 4,
                  "title": "第4轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "3",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-3",
                  "round": 3,
                  "title": "第3轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "3",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-2",
                  "round": 2,
                  "title": "第2轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "3",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "3",
                    "unit": "点",
                    "signed": false
                  }
                }
              ]
            },
            "accepted": {
              "groups": [
                {
                  "id": "round-5",
                  "round": 5,
                  "title": "第5轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "3",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-4",
                  "round": 4,
                  "title": "第4轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "3",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-3",
                  "round": 3,
                  "title": "第3轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "3",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-2",
                  "round": 2,
                  "title": "第2轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "3",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "3",
                    "unit": "点",
                    "signed": false
                  }
                }
              ]
            },
            "waiting": {
              "groups": [
                {
                  "id": "round-5",
                  "round": 5,
                  "title": "第5轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "3",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-4",
                  "round": 4,
                  "title": "第4轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "3",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-3",
                  "round": 3,
                  "title": "第3轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "3",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-2",
                  "round": 2,
                  "title": "第2轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "3",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "3",
                    "unit": "点",
                    "signed": false
                  }
                }
              ]
            },
            "result": {
              "groups": [
                {
                  "id": "round-5",
                  "round": 5,
                  "title": "第5轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "3",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-4",
                  "round": 4,
                  "title": "第4轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "3",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-3",
                  "round": 3,
                  "title": "第3轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "3",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-2",
                  "round": 2,
                  "title": "第2轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "3",
                    "unit": "点",
                    "signed": false
                  }
                },
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "complete",
                  "recap": "转出2点，返还3点",
                  "events": [
                    {
                      "id": "transfer",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "self",
                      "targetId": "other",
                      "verb": "转出",
                      "amount": "2",
                      "unit": "点",
                      "detail": "你收到放大后的6点"
                    },
                    {
                      "id": "return",
                      "type": "Interaction",
                      "status": "confirmed",
                      "actorId": "other",
                      "targetId": "self",
                      "verb": "返还",
                      "amount": "3",
                      "unit": "点"
                    }
                  ],
                  "metric": {
                    "label": "得分",
                    "value": "3",
                    "unit": "点",
                    "signed": false
                  }
                }
              ]
            }
          }
        }
      ],
      "recordPresentation": {
        "version": "a6.game-records/0.2",
        "scope": "game-only",
        "groupBy": "round",
        "order": "newest-first",
        "purpose": "快速复盘某一轮发生了什么",
        "salience": [
          "影响本轮的已知行动",
          "行动造成的已知变化",
          "已结算的本轮结果及本人影响"
        ],
        "projection": "server-authorized-reader-view-required",
        "history": "round-index-and-authorized-round-detail; no-client-global-filter",
        "review": {
          "sourceChecked": true,
          "realProjection": "pending",
          "visual": "representative-static-reviewed"
        },
        "important": "双方实际转出、放大到账与返还；本轮本人得分，不显示累计值冒充本轮得分。",
        "fixtureBasis": "066 N2 R5，每轮x2/y3，固定方向；仅双方互动及本人得分。",
        "numberPolicy": "a6.numbers/0.1"
      },
      "numberPolicy": "a6.numbers/0.1",
      "colors": {
        "ink": "#1d6940",
        "mid": "#69b183",
        "wash": "#e2efe6",
        "paper": "#f8fbf9",
        "canvas": "#f9fbfa",
        "surface": "#ffffff",
        "label": "#1f2320",
        "secondary": "#535a55",
        "line": "#cbcfcc"
      },
      "definitionHash": "bcab4782bdb22dbe7554aa05415d49879a66ab5f68455f2c5538c68660d5b111"
    },
    {
      "schemaVersion": "a6.game-ui/0.1",
      "id": "writing",
      "name": "持续共享文档的结构化写作",
      "theme": "creation",
      "source": {
        "path": "docs/games/library/candidates/036-structured-collaborative-writing.md",
        "sha256": "2e175482729d4f2dac55d6c9767c034e0c85ca0e0900a13379633706b71c24ef",
        "status": "candidate"
      },
      "brief": "轮流修改同一份共享文档，使内容符合已公布的事实与格式。固定轮数后按最终稿计分，并扣除已生效修改的成本。",
      "poster": {
        "scene": "两个人在同一张折页上依次替换纸片，共享文档的连续性清楚；不以分数或奖杯表现通用写作质量。",
        "status": "prompt-only",
        "motion": "paused"
      },
      "configuration": {
        "sections": [
          {
            "label": "基础",
            "open": true,
            "fields": [
              {
                "key": "rounds",
                "kind": "integer",
                "label": "游戏轮数",
                "default": 2,
                "min": 1
              }
            ]
          }
        ]
      },
      "identities": {
        "self": {
          "name": "林舟",
          "avatar": "default-neutral"
        },
        "other": {
          "name": "许言",
          "avatar": "coordination"
        }
      },
      "release": {
        "projection": "fixture-only",
        "semanticReview": "source-checked-design-fixture",
        "visualReview": "pending",
        "poster": "not-generated"
      },
      "scenarios": [
        {
          "id": "edit",
          "label": "编辑文档",
          "viewer": "self",
          "round": "2/2 轮",
          "step": "游戏 · 轮到你编辑",
          "action": {
            "type": "Decision",
            "title": "修改共享文档",
            "description": "修改一处，或保留原稿。",
            "facts": [
              {
                "label": "任务事实",
                "value": "X = 1 · Y = 0 · Z = 1"
              },
              {
                "label": "文档要求",
                "value": "保留3行，每次修改花费0.25点"
              }
            ],
            "artifact": {
              "label": "当前文档 · 版本2",
              "lines": [
                "X = 1",
                "Y = 0",
                "Y = 0",
                "Z = 1"
              ]
            },
            "fields": [
              {
                "type": "RecordEdit",
                "key": "edit",
                "label": "本次修改",
                "required": true,
                "version": 2,
                "rows": [
                  "X = 1",
                  "Y = 0",
                  "Y = 0",
                  "Z = 1"
                ],
                "operations": [
                  {
                    "value": "replace",
                    "label": "替换一行"
                  },
                  {
                    "value": "delete",
                    "label": "删除一行"
                  },
                  {
                    "value": "skip",
                    "label": "保持原稿"
                  }
                ],
                "facts": [
                  "X",
                  "Y",
                  "Z"
                ],
                "values": [
                  "0",
                  "1"
                ]
              }
            ],
            "submitLabel": "提交修改",
            "transport": {
              "actionId": "candidate036.edit",
              "completionMode": "submit_and_complete",
              "parameterMap": {
                "edit": "edit"
              }
            },
            "accepted": {
              "title": "修改已保存",
              "detail": "第3行已删除，其他人会接着这份文档编辑。",
              "values": {
                "edit": {
                  "kind": "delete",
                  "index": 2,
                  "version": 2
                }
              },
              "finishRequired": false
            }
          },
          "records": {
            "action": [
              {
                "label": "当前公开文档",
                "value": "版本2"
              },
              {
                "label": "已生效修改",
                "value": "2次"
              }
            ],
            "accepted": [
              {
                "label": "版本2 → 版本3",
                "value": "删除第3行重复的 Y = 0"
              },
              {
                "label": "已生效修改",
                "value": "3次"
              }
            ],
            "waiting": [
              {
                "label": "版本2 → 版本3",
                "value": "删除第3行重复的 Y = 0"
              },
              {
                "label": "已生效修改",
                "value": "3次"
              }
            ],
            "unknown": [
              {
                "label": "当前公开文档",
                "value": "版本2"
              },
              {
                "label": "已生效修改",
                "value": "2次"
              }
            ],
            "result": [
              {
                "label": "版本2 → 版本3",
                "value": "删除第3行重复的 Y = 0"
              },
              {
                "label": "已生效修改",
                "value": "3次"
              },
              {
                "label": "未生效尝试",
                "value": "1次，未收费"
              }
            ],
            "configuration": []
          },
          "result": {
            "type": "Outcome",
            "headline": "3项事实全部写对",
            "summary": null,
            "metric": {
              "label": "共同得分",
              "value": {
                "n": "21",
                "d": "4"
              },
              "unit": "点"
            },
            "facts": [
              {
                "label": "写对3项事实",
                "numeric": {
                  "n": "6",
                  "d": "1"
                },
                "unit": "点",
                "signed": true
              },
              {
                "label": "3次修改",
                "numeric": {
                  "n": "-3",
                  "d": "4"
                },
                "unit": "点",
                "signed": true
              }
            ],
            "artifact": {
              "label": "最终稿 · 版本3",
              "lines": [
                "X = 1",
                "Y = 0",
                "Z = 1"
              ]
            },
            "scope": "shared-artifact",
            "provenance": "036完整例N2R2。C3，其余内容扣分0；M3，成本3/4；共同精确21/4。非通用写作质量，不显示行政排名。",
            "round": "2/2 轮"
          },
          "fixtureBasis": "操作显示第二轮先行动编辑者的公开版本2；已受理为版本3。终局为该文档保留且最后一次过期尝试未生效的规则例。",
          "recordViews": {
            "configuration": {
              "groups": []
            },
            "action": {
              "groups": [
                {
                  "id": "round-2",
                  "round": 2,
                  "title": "第2轮",
                  "status": "in-progress",
                  "recap": "等待本轮修改",
                  "events": []
                },
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "complete",
                  "recap": "纠正X，补入Z",
                  "events": [
                    {
                      "id": "replace",
                      "type": "Revision",
                      "status": "confirmed",
                      "title": "替换第1行",
                      "before": "X = 0",
                      "after": "X = 1",
                      "version": "0 → 1"
                    },
                    {
                      "id": "insert",
                      "type": "Revision",
                      "status": "confirmed",
                      "title": "补入第4行",
                      "before": null,
                      "after": "Z = 1",
                      "version": "1 → 2"
                    }
                  ],
                  "snapshot": {
                    "label": "本轮结束时的文档 · 版本2",
                    "lines": [
                      "X = 1",
                      "Y = 0",
                      "Y = 0",
                      "Z = 1"
                    ]
                  }
                }
              ]
            },
            "unknown": {
              "groups": [
                {
                  "id": "round-2",
                  "round": 2,
                  "title": "第2轮",
                  "status": "in-progress",
                  "recap": "等待本轮修改",
                  "events": []
                },
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "complete",
                  "recap": "纠正X，补入Z",
                  "events": [
                    {
                      "id": "replace",
                      "type": "Revision",
                      "status": "confirmed",
                      "title": "替换第1行",
                      "before": "X = 0",
                      "after": "X = 1",
                      "version": "0 → 1"
                    },
                    {
                      "id": "insert",
                      "type": "Revision",
                      "status": "confirmed",
                      "title": "补入第4行",
                      "before": null,
                      "after": "Z = 1",
                      "version": "1 → 2"
                    }
                  ],
                  "snapshot": {
                    "label": "本轮结束时的文档 · 版本2",
                    "lines": [
                      "X = 1",
                      "Y = 0",
                      "Y = 0",
                      "Z = 1"
                    ]
                  }
                }
              ]
            },
            "accepted": {
              "groups": [
                {
                  "id": "round-2",
                  "round": 2,
                  "title": "第2轮",
                  "status": "in-progress",
                  "recap": "已删除重复行",
                  "events": [
                    {
                      "id": "delete",
                      "type": "Revision",
                      "status": "confirmed",
                      "title": "删除第3行重复内容",
                      "before": "Y = 0",
                      "after": null,
                      "version": "2 → 3"
                    }
                  ],
                  "snapshot": {
                    "label": "本轮文档 · 版本3",
                    "lines": [
                      "X = 1",
                      "Y = 0",
                      "Z = 1"
                    ]
                  }
                },
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "complete",
                  "recap": "纠正X，补入Z",
                  "events": [
                    {
                      "id": "replace",
                      "type": "Revision",
                      "status": "confirmed",
                      "title": "替换第1行",
                      "before": "X = 0",
                      "after": "X = 1",
                      "version": "0 → 1"
                    },
                    {
                      "id": "insert",
                      "type": "Revision",
                      "status": "confirmed",
                      "title": "补入第4行",
                      "before": null,
                      "after": "Z = 1",
                      "version": "1 → 2"
                    }
                  ],
                  "snapshot": {
                    "label": "本轮结束时的文档 · 版本2",
                    "lines": [
                      "X = 1",
                      "Y = 0",
                      "Y = 0",
                      "Z = 1"
                    ]
                  }
                }
              ]
            },
            "waiting": {
              "groups": [
                {
                  "id": "round-2",
                  "round": 2,
                  "title": "第2轮",
                  "status": "in-progress",
                  "recap": "已删除重复行",
                  "events": [
                    {
                      "id": "delete",
                      "type": "Revision",
                      "status": "confirmed",
                      "title": "删除第3行重复内容",
                      "before": "Y = 0",
                      "after": null,
                      "version": "2 → 3"
                    }
                  ],
                  "snapshot": {
                    "label": "本轮文档 · 版本3",
                    "lines": [
                      "X = 1",
                      "Y = 0",
                      "Z = 1"
                    ]
                  }
                },
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "complete",
                  "recap": "纠正X，补入Z",
                  "events": [
                    {
                      "id": "replace",
                      "type": "Revision",
                      "status": "confirmed",
                      "title": "替换第1行",
                      "before": "X = 0",
                      "after": "X = 1",
                      "version": "0 → 1"
                    },
                    {
                      "id": "insert",
                      "type": "Revision",
                      "status": "confirmed",
                      "title": "补入第4行",
                      "before": null,
                      "after": "Z = 1",
                      "version": "1 → 2"
                    }
                  ],
                  "snapshot": {
                    "label": "本轮结束时的文档 · 版本2",
                    "lines": [
                      "X = 1",
                      "Y = 0",
                      "Y = 0",
                      "Z = 1"
                    ]
                  }
                }
              ]
            },
            "result": {
              "groups": [
                {
                  "id": "round-2",
                  "round": 2,
                  "title": "第2轮",
                  "status": "complete",
                  "recap": "删除重复行，保留3项事实",
                  "events": [
                    {
                      "id": "delete",
                      "type": "Revision",
                      "status": "confirmed",
                      "title": "删除第3行重复内容",
                      "before": "Y = 0",
                      "after": null,
                      "version": "2 → 3"
                    }
                  ],
                  "snapshot": {
                    "label": "本轮结束时的文档 · 版本3",
                    "lines": [
                      "X = 1",
                      "Y = 0",
                      "Z = 1"
                    ]
                  }
                },
                {
                  "id": "round-1",
                  "round": 1,
                  "title": "第1轮",
                  "status": "complete",
                  "recap": "纠正X，补入Z",
                  "events": [
                    {
                      "id": "replace",
                      "type": "Revision",
                      "status": "confirmed",
                      "title": "替换第1行",
                      "before": "X = 0",
                      "after": "X = 1",
                      "version": "0 → 1"
                    },
                    {
                      "id": "insert",
                      "type": "Revision",
                      "status": "confirmed",
                      "title": "补入第4行",
                      "before": null,
                      "after": "Z = 1",
                      "version": "1 → 2"
                    }
                  ],
                  "snapshot": {
                    "label": "本轮结束时的文档 · 版本2",
                    "lines": [
                      "X = 1",
                      "Y = 0",
                      "Y = 0",
                      "Z = 1"
                    ]
                  }
                }
              ]
            }
          }
        }
      ],
      "recordPresentation": {
        "version": "a6.game-records/0.2",
        "scope": "game-only",
        "groupBy": "round",
        "order": "newest-first",
        "purpose": "快速复盘某一轮发生了什么",
        "salience": [
          "影响本轮的已知行动",
          "行动造成的已知变化",
          "已结算的本轮结果及本人影响"
        ],
        "projection": "server-authorized-reader-view-required",
        "history": "round-index-and-authorized-round-detail; no-client-global-filter",
        "review": {
          "sourceChecked": true,
          "realProjection": "pending",
          "visual": "representative-static-reviewed"
        },
        "important": "公开生效修改前后、版本顺序、本轮文档；不制造每轮质量分，不公开未经授权的他人失败尝试或编辑者身份。",
        "fixtureBasis": "036 N2 R2 公开版本0→1→2→3。没有明确的公开作者投影，因此示意不添加作者身份。共同分只属于终局。",
        "numberPolicy": "a6.numbers/0.1"
      },
      "numberPolicy": "a6.numbers/0.1",
      "colors": {
        "ink": "#02685f",
        "mid": "#46b3a6",
        "wash": "#dfefed",
        "paper": "#f7fbfa",
        "canvas": "#f9fbfb",
        "surface": "#ffffff",
        "label": "#1e2322",
        "secondary": "#515a59",
        "line": "#cacfce"
      },
      "definitionHash": "388fad05faf4aba1176cc4c7a80769d50d23dbc8978178672fcb9b169fbe9ccd"
    }
  ],
  "numberPolicy": "a6.numbers/0.1"
};
