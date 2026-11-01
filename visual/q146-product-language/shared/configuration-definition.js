/* Generated from source/configuration-source.json; display labels never alter configuration values. */
(() => {
	const source = {
  "version": "sgg.configuration/1",
  "provenance": "Existing q64 ExperienceBundle config; no new gameplay settings. Player count is owned by preparation seats.",
  "tools": [
    {
      "id": "profile",
      "label": "资料"
    },
    {
      "id": "forum",
      "label": "论坛"
    },
    {
      "id": "messages",
      "label": "私信"
    },
    {
      "id": "ratings",
      "label": "评分"
    }
  ],
  "games": {
    "trust": {
      "rounds": 5,
      "extraFields": [],
      "progressUnit": "round",
      "communication": 2
    },
    "network-pd": {
      "rounds": 5,
      "extraFields": [
        {
          "key": "disclosure",
          "label": "结算信息",
          "options": [
            {
              "value": "actions",
              "label": "邻居动作与边收益"
            },
            {
              "value": "payoff_only",
              "label": "本人动作与边收益"
            }
          ]
        }
      ],
      "disclosure": "actions",
      "progressUnit": "round",
      "communication": 2
    },
    "ultimatum": {
      "rounds": 3,
      "extraFields": [],
      "progressUnit": "round",
      "communication": 2
    },
    "best-shot": {
      "rounds": 5,
      "extraFields": [],
      "progressUnit": "round",
      "communication": 2
    },
    "stag-hunt": {
      "rounds": 3,
      "extraFields": [],
      "rationalFields": [
        {
          "key": "AA",
          "label": "双方选择 A",
          "value": {
            "n": "4",
            "d": "1"
          }
        },
        {
          "key": "BA",
          "label": "自己 B、伙伴 A",
          "value": {
            "n": "3",
            "d": "1"
          }
        },
        {
          "key": "BB",
          "label": "双方选择 B",
          "value": {
            "n": "2",
            "d": "1"
          }
        },
        {
          "key": "AB",
          "label": "自己 A、伙伴 B",
          "value": {
            "n": "0",
            "d": "1"
          }
        }
      ],
      "strictOrder": [
        "AA",
        "BA",
        "BB",
        "AB"
      ],
      "progressUnit": "round",
      "communication": 2
    },
    "dictator": {
      "rounds": 3,
      "extraFields": [],
      "progressUnit": "round",
      "communication": 2
    },
    "threshold-public-good": {
      "rounds": 3,
      "extraFields": [
        {
          "key": "institution",
          "label": "固定制度",
          "defaultValue": "R1",
          "options": [
            {
              "value": "R1",
              "label": "R1 · 贡献至少1"
            },
            {
              "value": "R3",
              "label": "R3 · 贡献至少3"
            }
          ]
        }
      ],
      "progressUnit": "round",
      "communication": 2
    },
    "hidden-profile": {
      "rounds": 5,
      "extraFields": [],
      "progressUnit": "revision",
      "communication": 2
    },
    "double-auction": {
      "rounds": 3,
      "extraFields": [],
      "progressUnit": "batch",
      "communication": 2
    },
    "cooperative-search": {
      "rounds": 3,
      "extraFields": [],
      "progressUnit": "search-step",
      "communication": 0
    },
    "local-graph-colouring": {
      "rounds": 3,
      "extraFields": [],
      "progressUnit": "round",
      "communication": 2
    },
    "strategic-relocation": {
      "rounds": 3,
      "extraFields": [],
      "rationalFields": [
        {
          "key": "sameCoefficient",
          "label": "同类相邻收益",
          "value": {
            "n": "2",
            "d": "1"
          }
        },
        {
          "key": "differentCoefficient",
          "label": "异类相邻收益",
          "value": {
            "n": "-1",
            "d": "1"
          }
        },
        {
          "key": "moveCost",
          "label": "尝试迁移成本",
          "value": {
            "n": "1",
            "d": "2"
          }
        }
      ],
      "progressUnit": "round",
      "communication": 2
    },
    "sequential-allocation": {
      "rounds": 2,
      "extraFields": [],
      "progressUnit": "round",
      "communication": 2
    },
    "structured-writing": {
      "rounds": 2,
      "extraFields": [],
      "progressUnit": "round",
      "communication": 2
    },
    "multi-issue-bargaining": {
      "rounds": 3,
      "extraFields": [],
      "progressUnit": "round",
      "communication": 2
    },
    "centralised-matching": {
      "rounds": 3,
      "extraFields": [],
      "progressUnit": "round",
      "communication": 2
    },
    "decentralised-matching": {
      "rounds": 3,
      "extraFields": [],
      "progressUnit": "round",
      "communication": 2
    },
    "minimum-effort": {
      "rounds": 5,
      "extraFields": [],
      "progressUnit": "round",
      "communication": 2
    },
    "ultimatum-eight": {
      "rounds": 3,
      "extraFields": [],
      "progressUnit": "round",
      "communication": 2
    },
    "shared-route-private-waypoints": {
      "rounds": 1,
      "fixedRounds": true,
      "communication": 2,
      "sessionConstraints": {
        "externalSocial": "disabled"
      },
      "extraFields": [],
      "progressUnit": "round"
    },
    "private-cost-task": {
      "rounds": 2,
      "extraFields": [
        {
          "key": "teamValue",
          "type": "rational",
          "label": "团队产值",
          "defaultValue": {
            "n": "10",
            "d": "1"
          }
        },
        {
          "key": "tasks",
          "type": "ordered-string-list",
          "label": "任务",
          "length": "participantCount",
          "unique": true
        },
        {
          "key": "costs",
          "type": "rational-matrix",
          "label": "个人任务成本",
          "rows": "participantCount",
          "columns": "tasks",
          "private": true,
          "minimum": {
            "n": "0",
            "d": "1"
          }
        }
      ],
      "progressUnit": "round",
      "communication": 2
    },
    "preference-coordination": {
      "rounds": 3,
      "extraFields": [],
      "rationalFields": [
        {
          "key": "h",
          "label": "偏好一致",
          "value": {
            "n": "3",
            "d": "1"
          }
        },
        {
          "key": "l",
          "label": "其他一致",
          "value": {
            "n": "2",
            "d": "1"
          }
        },
        {
          "key": "m",
          "label": "失配",
          "value": {
            "n": "0",
            "d": "1"
          }
        }
      ],
      "strictOrder": [
        "h",
        "l",
        "m"
      ],
      "progressUnit": "round",
      "communication": 2
    },
    "public-good-contribution": {
      "rounds": 2,
      "extraFields": [],
      "progressUnit": "round",
      "communication": 2
    },
    "cournot-competition": {
      "rounds": 2,
      "extraFields": [],
      "progressUnit": "round",
      "communication": 2
    },
    "simultaneous-demand": {
      "rounds": 3,
      "extraFields": [],
      "progressUnit": "round",
      "communication": 2
    },
    "travelers-dilemma": {
      "rounds": 2,
      "extraFields": [],
      "progressUnit": "round",
      "communication": 2
    },
    "volunteer-response": {
      "rounds": 3,
      "extraFields": [],
      "progressUnit": "round",
      "communication": 2
    },
    "rank-prize-effort": {
      "rounds": 2,
      "extraFields": [],
      "progressUnit": "round",
      "communication": 2
    },
    "plurality-voting": {
      "rounds": 3,
      "extraFields": [],
      "progressUnit": "round",
      "communication": 2
    },
    "evidence-committee": {
      "rounds": 3,
      "extraFields": [
        {
          "key": "institution",
          "type": "enum",
          "label": "表决方式",
          "defaultValue": "majority",
          "options": [
            {
              "value": "majority",
              "label": "多数决"
            },
            {
              "value": "supermajority",
              "label": "特定多数"
            },
            {
              "value": "unanimity",
              "label": "全体一致"
            }
          ]
        },
        {
          "key": "threshold",
          "type": "rational",
          "label": "特定多数门槛",
          "defaultValue": {
            "n": "2",
            "d": "3"
          }
        },
        {
          "key": "fallback",
          "type": "enum",
          "label": "固定兜底",
          "defaultValue": "0",
          "options": [
            {
              "value": "0",
              "label": "0"
            },
            {
              "value": "1",
              "label": "1"
            }
          ]
        },
        {
          "key": "reliability",
          "type": "ordered-rational-list",
          "label": "信号准确率",
          "length": "participantCount",
          "defaultItem": {
            "n": "3",
            "d": "4"
          },
          "itemBounds": {
            "exclusiveMinimum": {
              "n": "1",
              "d": "2"
            },
            "exclusiveMaximum": {
              "n": "1",
              "d": "1"
            }
          }
        },
        {
          "key": "correctPayoff",
          "type": "rational",
          "label": "答对所得",
          "defaultValue": {
            "n": "1",
            "d": "1"
          }
        },
        {
          "key": "incorrectPayoff",
          "type": "rational",
          "label": "答错所得",
          "defaultValue": {
            "n": "0",
            "d": "1"
          }
        }
      ],
      "progressUnit": "round",
      "communication": 2
    }
  }
};
	const label = (value) =>
		Object.defineProperty({ ...value }, "label", {
			enumerable: true,
			get: () => SGGI18n.systemCopy(value.label),
		});
	window.SGGConfigurationDefinition = {
		...source,
		tools: source.tools.map(label),
		games: Object.fromEntries(
			Object.entries(source.games).map(([id, game]) => [
				id,
				{
					...game,
					extraFields: game.extraFields.map((field) =>
						label({ ...field, ...(field.options ? { options: field.options.map(label) } : {}) }),
					),
					...(game.rationalFields ? { rationalFields: game.rationalFields.map(label) } : {}),
				},
			]),
		),
	};
})();
