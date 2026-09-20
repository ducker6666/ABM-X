"""Contrato solicitado y comparación con el motor JavaScript real de la web."""
import json
import subprocess
from pathlib import Path

import numpy as np
import pytest

from src.integrated_model import euclidean_memberships, jdj_euclidean_details


def test_poles_center_and_off_axis_memberships():
    points = [[1, 0], [0, 1], [.5, .5], [.2, .4], [0, 0], [1, 1]]
    memberships = euclidean_memberships(points)
    assert memberships[:3] == pytest.approx(np.array([[1, 0], [0, 1], [.5, .5]]))
    assert memberships[3] == pytest.approx([.3675444679663241, .5527864045000421])
    assert memberships[3].sum() < 1
    assert jdj_euclidean_details([[.5, .5]])['value'] == pytest.approx(.5)
    assert jdj_euclidean_details([[0, 0]])['value'] == pytest.approx(.17157287525381)
    assert jdj_euclidean_details([[1, 0], [0, 1]])['value'] == 1


def test_web_and_python_use_identical_arithmetic():
    cases = [[], [[1, 0]], [[0, 1]], [[.5, .5]], [[.2, .4]],
             [[0, 0], [1, 1]], [[1, 0], [0, 1]],
             np.random.default_rng(123).random((100, 2)).tolist()]
    script = """
const m=require('./web/model.js');
const cases=JSON.parse(require('fs').readFileSync(0,'utf8'));
console.log(JSON.stringify(cases.map(points=>{
  const agents=points.map(([x,y])=>({x,y}));
  return {memberships:agents.map(m.euclideanMemberships),details:m.jdjEuclideanDetails(agents)};
})));
"""
    result = subprocess.run(['node', '-e', script], input=json.dumps(cases),
                            text=True, capture_output=True, check=True,
                            cwd=Path(__file__).resolve().parents[1])
    for points, web in zip(cases, json.loads(result.stdout)):
        py = jdj_euclidean_details(points)
        assert py['value'] == web['details']['value']
        assert py['pair_sum'] == web['details']['pairSum']
        for pair, membership in zip(euclidean_memberships(points), web['memberships']):
            assert pair.tolist() == [membership['a'], membership['b']]


def test_invalid_positions_are_rejected():
    for points in [[[2, 0]], [[float('nan'), .5]]]:
        with pytest.raises(ValueError):
            euclidean_memberships(points)
